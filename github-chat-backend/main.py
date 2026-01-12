from dotenv import load_dotenv
load_dotenv()

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from agent import detect_tool_category, select_mcp_tool, client
from tool_registry import ToolRegistry
from mcp_client import GitHubMCPClient

# Logging yapılandırması
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

app = FastAPI()

# CORS middleware ekle
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

registry = ToolRegistry()
mcp = GitHubMCPClient()


class ChatRequest(BaseModel):
    message: str


@app.post("/chat")
async def chat(req: ChatRequest):
    logger.info(f"[main.chat] Başlangıç - Kullanıcı mesajı: {req.message[:100]}...")
    
    logger.info("[main.chat] → detect_tool_category() çağrılıyor")
    category = await detect_tool_category(req.message)
    logger.info(f"[main.chat] ← detect_tool_category() döndü: category={category}")

    if category == "none":
        logger.warning(f"[main.chat] GitHub ile ilgili değil, cevap döndürülüyor")
        return {"reply": "Bu soru GitHub ile ilgili görünmüyor."}

    logger.info(f"[main.chat] → registry.get_tools_by_category(category='{category}') çağrılıyor")
    tools = await registry.get_tools_by_category(category)
    logger.info(f"[main.chat] ← registry.get_tools_by_category() döndü: {len(tools)} tool bulundu")

    if not tools:
        logger.warning(f"[main.chat] Kategori için tool bulunamadı: {category}")
        return {"reply": "Bu konu için uygun GitHub aracı bulunamadı."}

    logger.info(f"[main.chat] → select_mcp_tool() çağrılıyor - {len(tools)} tool ile")
    plan = await select_mcp_tool(req.message, tools)
    logger.info(f"[main.chat] ← select_mcp_tool() döndü: {plan}")

    if not plan:
        logger.warning(f"[main.chat] Tool seçilemedi")
        return {"reply": "Bu istek için uygun bir GitHub işlemi seçilemedi."}

    logger.info(f"[main.chat] → mcp.call_tool(name='{plan['tool_name']}', arguments={plan['arguments']}) çağrılıyor")
    raw_result = await mcp.call_tool(
        name=plan["tool_name"],
        arguments=plan["arguments"],
    )
    logger.info(f"[main.chat] ← mcp.call_tool() döndü: result_type={type(raw_result).__name__}")

    # MCP'den dönen cevabı parse et
    logger.info("[main.chat] MCP sonucu parse ediliyor...")
    result_text = ""
    if isinstance(raw_result, list):
        logger.info(f"[main.chat] Sonuç liste formatında, {len(raw_result)} item")
        result_text = "\n".join([
            str(item) if not isinstance(item, dict) else 
            item.get("text", str(item)) if "text" in item else str(item)
            for item in raw_result
        ])
    elif isinstance(raw_result, dict):
        logger.info("[main.chat] Sonuç dict formatında")
        result_text = raw_result.get("text", raw_result.get("content", str(raw_result)))
    else:
        logger.info(f"[main.chat] Sonuç diğer format: {type(raw_result)}")
        result_text = str(raw_result)

    logger.info(f"[main.chat] Parse edilmiş sonuç uzunluğu: {len(result_text)} karakter")
    logger.info("[main.chat] → OpenAI formatlama çağrılıyor")
    formatted = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system", 
                "content": (
                    "Sen bir GitHub veri özetleyicisisin.\n"
                    "MCP'den gelen ham GitHub verisini al ve kullanıcıya Türkçe, anlaşılır, "
                    "düzenli bir şekilde açıkla.\n"
                    "Teknik detayları koru ama kullanıcı dostu bir dil kullan."
                )
            },
            {
                "role": "user", 
                "content": f"Kullanıcının sorusu: {req.message}\n\nMCP'den gelen veri:\n{result_text}"
            },
        ],
    )
    logger.info(f"[main.chat] ← OpenAI formatlama tamamlandı, cevap uzunluğu: {len(formatted.choices[0].message.content)} karakter")
    logger.info(f"[main.chat] Tamamlandı - Cevap döndürülüyor")

    return {"reply": formatted.choices[0].message.content}