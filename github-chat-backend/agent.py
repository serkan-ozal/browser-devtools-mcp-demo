import os
import logging
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


async def detect_tool_category(message: str) -> str:
    logger.info(f"[agent.detect_tool_category] Başlangıç - Mesaj: {message[:100]}...")
    logger.info("[agent.detect_tool_category] → OpenAI API çağrılıyor (kategori tespiti)")
    
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    "Kullanıcı mesajını oku ve GitHub MCP tool kategorisini seç.\n"
                    "Sadece şunlardan birini döndür:\n"
                    "- repositories\n"
                    "- pull_requests\n"
                    "- issues\n"
                    "- users\n"
                    "- search\n"
                    "- context\n"
                    "- actions\n"
                    "- code_security\n"
                    "- dependabot\n"
                    "- discussions\n"
                    "- gists\n"
                    "- git\n"
                    "- labels\n"
                    "- notifications\n"
                    "- orgs\n"
                    "- projects\n"
                    "- secret_protection\n"
                    "- security_advisories\n"
                    "- stargazers\n"
                    "- none\n"
                    "Sadece tek kelime cevap ver."
                ),
            },
            {"role": "user", "content": message},
        ],
    )
    
    category = resp.choices[0].message.content.strip().lower()
    logger.info(f"[agent.detect_tool_category] ← OpenAI API döndü: category='{category}'")
    return category


def _convert_mcp_tool_to_openai_format(mcp_tool: dict) -> dict:
    """Convert MCP tool format to OpenAI tool format"""
    tool_name = mcp_tool.get("name", "")
    logger.debug(f"[agent._convert_mcp_tool_to_openai_format] Tool dönüştürülüyor: {tool_name}")
    
    tool_description = mcp_tool.get("description", "")
    input_schema = mcp_tool.get("inputSchema", {})
    
    return {
        "type": "function",
        "function": {
            "name": tool_name,
            "description": tool_description,
            "parameters": input_schema
        }
    }


async def select_mcp_tool(message: str, mcp_tools: list):
    """Use OpenAI to select the appropriate MCP tool based on user message"""
    logger.info(f"[agent.select_mcp_tool] Başlangıç - {len(mcp_tools)} tool ile")
    logger.info(f"[agent.select_mcp_tool] Mesaj: {message[:100]}...")
    
    # Convert MCP tools to OpenAI format
    logger.info("[agent.select_mcp_tool] → MCP tool'ları OpenAI formatına dönüştürülüyor")
    openai_tools = [_convert_mcp_tool_to_openai_format(tool) for tool in mcp_tools]
    logger.info(f"[agent.select_mcp_tool] ← {len(openai_tools)} tool dönüştürüldü")
    
    logger.info("[agent.select_mcp_tool] → OpenAI API çağrılıyor (tool seçimi)")
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    "Sen bir GitHub MCP tool seçici asistansın.\n"
                    "Kullanıcının mesajını analiz et ve uygun GitHub MCP tool'unu seç.\n"
                    "Sadece açıkça gerekli olduğunda bir tool çağır.\n"
                    "Kullanıcıya direkt cevap verme, sadece tool seç."
                ),
            },
            {"role": "user", "content": message},
        ],
        tools=openai_tools,
        tool_choice="auto",
    )
    logger.info("[agent.select_mcp_tool] ← OpenAI API döndü")

    msg = response.choices[0].message

    # Check if OpenAI selected a tool
    if msg.tool_calls and len(msg.tool_calls) > 0:
        tool_call = msg.tool_calls[0]
        logger.info(f"[agent.select_mcp_tool] Tool seçildi: {tool_call.function.name}")
        
        # Parse arguments - could be string or dict
        arguments = tool_call.function.arguments
        if isinstance(arguments, str):
            import json
            try:
                arguments = json.loads(arguments)
                logger.debug(f"[agent.select_mcp_tool] Arguments JSON parse edildi")
            except json.JSONDecodeError as e:
                logger.warning(f"[agent.select_mcp_tool] JSON parse hatası: {e}, boş dict döndürülüyor")
                arguments = {}
        
        result = {
            "tool_name": tool_call.function.name,
            "arguments": arguments,
        }
        logger.info(f"[agent.select_mcp_tool] Sonuç: {result}")
        return result

    logger.warning("[agent.select_mcp_tool] Tool seçilmedi, None döndürülüyor")
    return None