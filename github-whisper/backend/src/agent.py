import os
import json
from typing import Any, Optional, Annotated
from dataclasses import dataclass
from dotenv import load_dotenv

from langchain_core.messages import (
    BaseMessage,
    HumanMessage,
    AIMessage,
    SystemMessage,
    ToolMessage,
)
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.checkpoint.memory import MemorySaver

# MCP Adapters for GitHub
from langchain_mcp_adapters.client import MultiServerMCPClient
from .modular_skill_loader import load_skills_for_message, get_skill_stats

load_dotenv()

# ----------------------------------------------------------------------
# Constants
# ----------------------------------------------------------------------

GITHUB_MCP_URL = "https://api.githubcopilot.com/mcp/"
TOOL_OUTPUT_MAX_CHARS = 200_000


# ----------------------------------------------------------------------
# State Field Registry (Single Source of Truth)
# ----------------------------------------------------------------------

STATE_FIELDS = {
    "activeOrg": {
        "name": "activeOrg",
        "description": "Current GitHub organization context (org or user namespace).",
        "examples": [
            "My org is acme",
            "Use organization openai",
            "Switch to org my-company",
            "clear org",
        ],
        "hints": ["org", "organization", "workspace"],
    },
    "activeRepo": {
        "name": "activeRepo",
        "description": "Current GitHub repository context (usually owner/repo).",
        "examples": [
            "Use repo open-telemetry/opentelemetry-collector",
            "Repository is foo/bar",
            "Switch to repo my-org/my-repo",
            "clear repo",
        ],
        "hints": ["repo", "repository", "project"],
    },
    "activeBranch": {
        "name": "activeBranch",
        "description": "Current git branch context (e.g., main, develop, feature/foo).",
        "examples": [
            "Use branch main",
            "branch develop",
            "Switch to feature/login",
            "clear branch",
        ],
        "hints": ["branch", "ref"],
    },
}


# ----------------------------------------------------------------------
# Type Definitions
# ----------------------------------------------------------------------

@dataclass
class AgentHandle:
    """Handle containing the compiled agent and cleanup function."""
    agent: Any
    close: Any  # Callable to close MCP connection


class AgentState:
    """Type hints for agent state (used with TypedDict in practice)."""
    messages: list[BaseMessage]
    toolRetryCount: int
    activeOrg: Optional[str]
    activeRepo: Optional[str]
    activeBranch: Optional[str]


# ----------------------------------------------------------------------
# Utility Functions
# ----------------------------------------------------------------------

def require_env(name: str) -> str:
    """Get required environment variable or raise error."""
    value = os.getenv(name)
    if not value:
        raise ValueError(f"Missing env var: {name}")
    return value


def content_to_string(content: Any) -> str:
    """Convert message content to string."""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return "\n".join(content_to_string(c) for c in content)
    if isinstance(content, dict) and "text" in content:
        return str(content["text"])
    return ""


def safe_json_parse(text: str) -> Optional[dict]:
    """Safely parse JSON, return None on failure."""
    try:
        return json.loads(text)
    except (json.JSONDecodeError, TypeError):
        return None


def get_state_keys() -> list[str]:
    """Get list of state field keys."""
    return list(STATE_FIELDS.keys())


def get_last_user_text(messages: list[BaseMessage]) -> str:
    """Get the last human message text from message list."""
    for m in reversed(messages):
        if isinstance(m, HumanMessage):
            return content_to_string(m.content).strip()
    return ""


def get_tool_calls_from_ai_message(message: AIMessage) -> list[dict]:
    """Extract tool calls from an AI message."""
    # Try direct tool_calls attribute
    if hasattr(message, "tool_calls") and message.tool_calls:
        return message.tool_calls

    # Try additional_kwargs
    if hasattr(message, "additional_kwargs"):
        tool_calls = message.additional_kwargs.get("tool_calls", [])
        if tool_calls:
            return tool_calls

    return []


def truncate_text(text: str, max_chars: int) -> str:
    """Truncate text to max characters with indicator."""
    if len(text) <= max_chars:
        return text
    return f"{text[:max_chars]}\n...[truncated {len(text) - max_chars} chars]"


def parse_state_update(raw: Any) -> dict[str, Optional[str]]:
    """Parse state update from raw object."""
    upd = {}
    keys = get_state_keys()

    if not isinstance(raw, dict):
        return upd

    for k in keys:
        if k in raw:
            v = raw[k]
            if isinstance(v, str) or v is None:
                upd[k] = v

    return upd


def apply_state_update(upd: dict[str, Optional[str]]) -> dict[str, Any]:
    """Apply state update, converting null to removal."""
    out = {}
    keys = get_state_keys()

    for k in keys:
        if k not in upd:
            continue
        v = upd[k]
        if v is None:
            out[k] = None  # Will be handled as clear
        else:
            out[k] = v

    return out


# ----------------------------------------------------------------------
# Prompt Builders
# ----------------------------------------------------------------------

def build_allowed_keys_prompt_section() -> str:
    """Build prompt section describing allowed state keys."""
    lines = ["Allowed state keys (ONLY these; values must be string or null):"]

    for k in get_state_keys():
        meta = STATE_FIELDS[k]
        lines.append(f"- {meta['name']}: {meta['description']}")

    return "\n".join(lines)


def build_examples_prompt_section() -> str:
    """Build prompt section with examples."""
    lines = ["Examples of user messages that SHOULD update state:"]

    for k in get_state_keys():
        meta = STATE_FIELDS[k]
        lines.append(f"- {meta['name']} examples:")
        for ex in meta["examples"]:
            lines.append(f'  - "{ex}"')

    return "\n".join(lines)


def build_state_extractor_prompt(current_state: dict[str, str], user_text: str) -> str:
    """Build the prompt for state extraction."""
    allowed_keys = build_allowed_keys_prompt_section()
    examples = build_examples_prompt_section()

    state_lines = []
    for k in get_state_keys():
        v = current_state.get(k, "(none)")
        state_lines.append(f'{k}="{v}"')

    return "\n".join([
        "You extract state updates from the latest USER message.",
        "Return JSON ONLY (no markdown, no commentary).",
        "",
        allowed_keys,
        "",
        "Rules:",
        "- Output a JSON object (possibly empty).",
        "- Only include keys from the allowed list.",
        "- Only set a key if the user explicitly provided that value to set/change context.",
        "- If the user explicitly wants to clear a value, set that key to null.",
        "- If the user is asking a question, discussing a topic, or NOT providing context values, return {}.",
        "",
        examples,
        "",
        "Current state:",
        ", ".join(state_lines),
        "",
        "User message:",
        user_text,
    ])


def build_state_repair_prompt(raw_text: str) -> str:
    """Build prompt for repairing invalid JSON."""
    allowed_keys = build_allowed_keys_prompt_section()

    return "\n".join([
        "You are a JSON repair utility.",
        "Convert the given content into a JSON object that only contains allowed state keys.",
        "Output JSON ONLY.",
        "",
        allowed_keys,
        "",
        "Rules:",
        "- Output an object (possibly empty).",
        "- Values must be string or null.",
        "- Do not include any other keys.",
        "",
        "Content:",
        raw_text,
    ])


def build_agent_system_prompt(state: dict, user_message: str = "") -> str:
    """
    Build the main agent system prompt.
    
    DEĞİŞİKLİK: Artık modüler skill yüklüyor - sadece gerekli olanlar!
    
    Args:
        state: Current agent state
        user_message: Latest user message (for skill selection)
    """
    keys = get_state_keys()

    ctx_parts = []
    for k in keys:
        v = state.get(k, "(none)")
        if v is None:
            v = "(none)"
        ctx_parts.append(f"{k}={v}")

    no_ask_lines = []
    for k in keys:
        no_ask_lines.append(
            f"- If {k} is set, do not ask for it again unless the user asks to change/clear it."
        )

    # Base instructions
    base_instructions = "\n".join([
        "You are a GitHub-aware assistant with access to GitHub tools.",
        "",
        "Rules:",
        "- Always try to answer the user.",
        "- If you need additional info (org/repo/branch/path), ask in normal language.",
        "- Do not guess missing info.",
        "- Use tools when they help.",
        "",
        "Context usage rules:",
        *no_ask_lines,
        "",
        f"Current context: {' '.join(ctx_parts)}",
    ])

    # YENİ: Modüler skill yükleme
    skill_section = ""
    if user_message:
        # Load only required skills for user message
        skill_content = load_skills_for_message(user_message)
        
        if skill_content:
            skill_section = f"""

<github_mcp_skill>
{skill_content}
</github_mcp_skill>

🎯 CRITICAL: Follow the skill guidelines above for token optimization and best practices.
"""
    print(f"Skill section: {skill_section}")
    # Combine
    return base_instructions + skill_section


# ----------------------------------------------------------------------
# Agent Factory
# ----------------------------------------------------------------------

async def create_agent() -> AgentHandle:
    """
    Create and return the GitHub chatbot agent.

    Returns:
        AgentHandle with compiled agent and close function.
    """
    require_env("OPENAI_API_KEY")
    github_pat = require_env("GITHUB_PAT")

    # ---------------- MCP Tools ----------------

    mcp = MultiServerMCPClient({
        "github": {
            "transport": "http",
            "url": GITHUB_MCP_URL,
            "headers": {
                "Authorization": f"Bearer {github_pat}",
                "X-MCP-Toolsets": "repos,issues,actions,discussions,issues,notifications,pull_requests,users,projects",
                "X-MCP-Readonly": "true",
            },
        },
    })

    # Get tools from MCP
    raw_tools = await mcp.get_tools()
    tools = [t for t in raw_tools if hasattr(t, "name") and hasattr(t, "invoke")]

    tool_by_name = {t.name: t for t in tools}

    # ---------------- LLM (Native Tool Calling) ----------------

    llm = ChatOpenAI(
        model="gpt-4.1-mini",
        temperature=0.2,
    )

    llm_with_tools = llm.bind_tools(tools)

    # ---------------- State Extractor (JSON Mode) ----------------

    try:
        state_extractor = ChatOpenAI(
            model="gpt-4.1-mini",
            temperature=0,
            model_kwargs={"response_format": {"type": "json_object"}},
        )
    except Exception:
        state_extractor = ChatOpenAI(
            model="gpt-4.1-mini",
            temperature=0,
        )

    # ---------------- Memory ----------------

    checkpointer = MemorySaver()

    # ---------------- LangGraph State Schema ----------------

    from typing import TypedDict

    class GraphState(TypedDict):
        messages: Annotated[list[BaseMessage], add_messages]
        toolRetryCount: int
        activeOrg: Optional[str]
        activeRepo: Optional[str]
        activeBranch: Optional[str]
        tokenUsage: Optional[dict[str, int]]  # {"prompt_tokens": int, "completion_tokens": int, "total_tokens": int}

    # ---------------- Nodes ----------------

    def extract_token_usage(response: Any) -> Optional[dict[str, int]]:
        """Extract token usage from LLM response."""
        if not hasattr(response, "response_metadata"):
            return None
        
        metadata = response.response_metadata
        if not metadata or "token_usage" not in metadata:
            return None
        
        token_usage = metadata["token_usage"]
        if not isinstance(token_usage, dict):
            return None
        
        return {
            "prompt_tokens": token_usage.get("prompt_tokens", 0),
            "completion_tokens": token_usage.get("completion_tokens", 0),
            "total_tokens": token_usage.get("total_tokens", 0),
        }

    def merge_token_usage(current: Optional[dict[str, int]], new: Optional[dict[str, int]]) -> dict[str, int]:
        """Merge two token usage dictionaries."""
        if not current and not new:
            return {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}
        if not current:
            return new or {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}
        if not new:
            return current
        
        return {
            "prompt_tokens": current.get("prompt_tokens", 0) + new.get("prompt_tokens", 0),
            "completion_tokens": current.get("completion_tokens", 0) + new.get("completion_tokens", 0),
            "total_tokens": current.get("total_tokens", 0) + new.get("total_tokens", 0),
        }

    async def pre_extract_state_node(state: GraphState) -> dict:
        """Pre-extract state updates from user message before agent runs."""
        user_text = get_last_user_text(state["messages"])

        if not user_text or not user_text.strip():
            return {}

        current_state = {}
        for k in get_state_keys():
            v = state.get(k)
            if isinstance(v, str):
                current_state[k] = v

        system_text = build_state_extractor_prompt(current_state, user_text)

        upd = None
        raw_text = ""
        total_token_usage = state.get("tokenUsage")

        # Attempt 1
        resp = await state_extractor.ainvoke([SystemMessage(content=system_text)])
        token_usage = extract_token_usage(resp)
        if token_usage:
            total_token_usage = merge_token_usage(total_token_usage, token_usage)
        raw_text = content_to_string(resp.content)
        parsed = safe_json_parse(raw_text)

        if parsed:
            upd = parse_state_update(parsed)

        # Attempt 2 (retry)
        if not upd:
            retry_prompt = "\n".join([
                system_text,
                "",
                "IMPORTANT: Your previous output was invalid. Output JSON object only with allowed keys.",
            ])

            resp = await state_extractor.ainvoke([SystemMessage(content=retry_prompt)])
            token_usage = extract_token_usage(resp)
            if token_usage:
                total_token_usage = merge_token_usage(total_token_usage, token_usage)
            raw_text = content_to_string(resp.content)
            parsed = safe_json_parse(raw_text)

            if parsed:
                upd = parse_state_update(parsed)

        # Attempt 3 (repair)
        if not upd:
            repair_prompt = build_state_repair_prompt(raw_text)
            resp = await state_extractor.ainvoke([SystemMessage(content=repair_prompt)])
            token_usage = extract_token_usage(resp)
            if token_usage:
                total_token_usage = merge_token_usage(total_token_usage, token_usage)
            repaired_text = content_to_string(resp.content)
            parsed = safe_json_parse(repaired_text)

            if parsed:
                upd = parse_state_update(parsed)

        result = {}
        if upd:
            result.update(apply_state_update(upd))
        if total_token_usage:
            result["tokenUsage"] = total_token_usage

        return result

    async def agent_node(state: GraphState) -> dict:
        """
        Main agent reasoning node.
        
        DEĞİŞİKLİK: User message'ı extract edip skill loader'a geçiriyor!
        """
        # Son user mesajını al
        user_message = get_last_user_text(state["messages"])
        
        # System prompt oluştur (modüler skill ile)
        system_text = build_agent_system_prompt(state, user_message)
        system = SystemMessage(content=system_text)

        response = await llm_with_tools.ainvoke([system, *state["messages"]])
        
        # Token usage tracking
        token_usage = extract_token_usage(response)
        current_token_usage = state.get("tokenUsage")
        if token_usage:
            merged_usage = merge_token_usage(current_token_usage, token_usage)
            return {"messages": [response], "tokenUsage": merged_usage}
        
        return {"messages": [response]}

    async def tools_node(state: GraphState) -> dict:
        """Tool execution node."""
        messages = state["messages"]
        if not messages:
            return {}

        last = messages[-1]
        if not isinstance(last, AIMessage):
            return {}

        tool_calls = get_tool_calls_from_ai_message(last)
        if not tool_calls:
            return {}

        tool_messages = []
        saw_schema_mismatch = False

        for call in tool_calls:
            tool_name = call.get("name", "")
            tool = tool_by_name.get(tool_name)

            if not tool:
                tool_messages.append(
                    ToolMessage(
                        content=f"Tool not found: {tool_name}",
                        tool_call_id=call.get("id", "tool"),
                    )
                )
                continue

            try:
                result = await tool.ainvoke(call.get("args", {}))
                raw = result if isinstance(result, str) else json.dumps(result)
                content = truncate_text(raw, TOOL_OUTPUT_MAX_CHARS)

                tool_messages.append(
                    ToolMessage(
                        content=content,
                        tool_call_id=call.get("id", "tool"),
                    )
                )
            except Exception as err:
                msg = str(err)

                if "Received tool input did not match expected schema" in msg:
                    saw_schema_mismatch = True

                tool_messages.append(
                    ToolMessage(
                        content=f"Tool '{tool_name}' failed: {msg}",
                        tool_call_id=call.get("id", "tool"),
                    )
                )

        next_retry = state.get("toolRetryCount", 0)

        if saw_schema_mismatch:
            if next_retry < 1:
                next_retry += 1
        else:
            next_retry = 0

        return {
            "messages": tool_messages,
            "toolRetryCount": next_retry,
        }

    async def end_node(state: GraphState) -> dict:
        """End node (no-op)."""
        return {}

    # ---------------- Routing ----------------

    def route_after_agent(state: GraphState) -> str:
        """Route after agent: tools if tool_calls exist, else end."""
        messages = state["messages"]
        if not messages:
            return "end"

        last = messages[-1]
        if isinstance(last, AIMessage):
            tool_calls = get_tool_calls_from_ai_message(last)
            if tool_calls:
                return "tools"

        return "end"

    def route_after_tools(state: GraphState) -> str:
        """Route after tools: always back to agent."""
        return "agent"

    # ---------------- Build Graph ----------------

    workflow = StateGraph(GraphState)

    workflow.add_node("pre_extract", pre_extract_state_node)
    workflow.add_node("agent", agent_node)
    workflow.add_node("tools", tools_node)
    workflow.add_node("end", end_node)

    workflow.add_edge(START, "pre_extract")
    workflow.add_edge("pre_extract", "agent")
    workflow.add_conditional_edges("agent", route_after_agent, ["tools", "end"])
    workflow.add_conditional_edges("tools", route_after_tools, ["agent"])
    workflow.add_edge("end", END)

    agent = workflow.compile(checkpointer=checkpointer)

    async def close():
        """Close MCP connection."""
        try:
            if hasattr(mcp, "close"):
                await mcp.close()
        except Exception:
            pass

    return AgentHandle(agent=agent, close=close)