import os
import json
from openai import OpenAI
from dotenv import load_dotenv
from github_tools import read_github_repo

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# --------------------------------------------------
# 1️⃣ SYSTEM PROMPT → DETERMINISTIC TOOL FORCING
# --------------------------------------------------
SYSTEM_PROMPT = """
You are a GitHub assistant.

RULES:
- If the user asks about a GitHub repository, README, file, code, structure or implementation,
  you MUST call the GitHub tool.
- NEVER answer GitHub-related questions from memory.
- Always fetch data from GitHub before answering.
- If repository information is missing, infer the most likely repository.
"""

# --------------------------------------------------
# TOOL DEFINITION (MCP-LIKE)
# --------------------------------------------------
tools = [
    {
        "type": "function",
        "function": {
            "name": "read_github_repo",
            "description": "Read files or metadata from a GitHub repository",
            "parameters": {
                "type": "object",
                "properties": {
                    "owner": {"type": "string"},
                    "repo": {"type": "string"},
                    "path": {"type": "string"},
                },
                "required": ["owner", "repo"],
            },
        },
    }
]

# --------------------------------------------------
# 2️⃣ REPO / OWNER / PATH AUTO EXTRACTION
# --------------------------------------------------
def extract_repo_info(text: str):
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    "Extract GitHub repository information from the message. "
                    "Return STRICT JSON only. Example:\n"
                    '{ "owner": "facebook", "repo": "react", "path": "README.md" }\n'
                    "If path is not mentioned, omit it."
                ),
            },
            {"role": "user", "content": text},
        ],
    )

    try:
        return json.loads(response.choices[0].message.content)
    except Exception:
        return None

# --------------------------------------------------
# MAIN AGENT
# --------------------------------------------------
async def run_agent(user_message: str):
    repo_info = extract_repo_info(user_message)

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        tools=tools,
        tool_choice="auto",
    )

    message = response.choices[0].message

    # ---- TOOL ÇAĞRISI ----
    if message.tool_calls:
        call = message.tool_calls[0]

        # 🔒 Güvenli parse (eval YOK)
        args = json.loads(call.function.arguments)
        print("🟢 GITHUB TOOL ÇAĞRILDI")
        print("OWNER:", args.get("owner"))
        print("REPO:", args.get("repo"))
        print("PATH:", args.get("path"))
        # Repo info eksikse ön analizden tamamla
        if repo_info:
            args.setdefault("owner", repo_info.get("owner"))
            args.setdefault("repo", repo_info.get("repo"))
            args.setdefault("path", repo_info.get("path"))

        result = read_github_repo(
            owner=args["owner"],
            repo=args["repo"],
            path=args.get("path"),
        )

        followup = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
                message,
                {
                    "role": "tool",
                    "tool_call_id": call.id,
                    "content": json.dumps(result),
                },
            ],
        )

        return followup.choices[0].message.content

    return message.content

# --------------------------------------------------
# 3️⃣ STREAMING (OPTIONAL – CHAT FEEL)
# --------------------------------------------------
async def run_agent_stream(user_message: str):
    stream = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        stream=True,
    )

    for event in stream:
        delta = event.choices[0].delta
        if delta and delta.content:
            yield delta.content