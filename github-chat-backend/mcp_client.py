import os
import logging
from dotenv import load_dotenv
from mcp.client.session import ClientSession
from mcp.client.streamable_http import streamable_http_client
from mcp.shared._httpx_utils import create_mcp_http_client
import mcp.types as types

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

GITHUB_MCP_URL = os.getenv("GITHUB_MCP_URL", "https://api.githubcopilot.com/mcp")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")


class GitHubMCPClient:
    def __init__(self):
        self.url = GITHUB_MCP_URL
        self.token = GITHUB_TOKEN
        if not self.token:
            logger.warning("[mcp_client.__init__] GITHUB_TOKEN bulunamadı! .env dosyasını kontrol edin.")
        else:
            logger.info(f"[mcp_client.__init__] Client oluşturuldu - URL: {self.url}, Token başı: {self.token[:20]}...")

    async def list_tools(self):
        """List available MCP tools"""
        logger.info(f"[mcp_client.list_tools] Başlangıç - URL: {self.url}")
        
        if not self.token:
            logger.error("[mcp_client.list_tools] GITHUB_TOKEN bulunamadı! .env dosyasını kontrol edin.")
            raise ValueError("GITHUB_TOKEN environment variable bulunamadı")
        
        headers = {}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"  # Tam token'ı kullan
            logger.info(f"[mcp_client.list_tools] Authorization header eklendi (token başı: {self.token[:20]}...)")
        else:
            logger.warning("[mcp_client.list_tools] Token yok, Authorization header eklenmedi")
        
        logger.info("[mcp_client.list_tools] → create_mcp_http_client() çağrılıyor")
        http_client = create_mcp_http_client(headers=headers)
        logger.info("[mcp_client.list_tools] → streamable_http_client() bağlantısı açılıyor")
        
        try:
            async with streamable_http_client(self.url, http_client=http_client) as (read_stream, write_stream, _):
                logger.info("[mcp_client.list_tools] → ClientSession oluşturuluyor")
                client_info = types.Implementation(name="github-chat-backend", version="1.0.0")
                async with ClientSession(read_stream, write_stream, client_info=client_info) as session:
                    logger.info("[mcp_client.list_tools] → session.initialize() çağrılıyor")
                    await session.initialize()
                    logger.info("[mcp_client.list_tools] ← session.initialize() tamamlandı")
                    
                    logger.info("[mcp_client.list_tools] → session.list_tools() çağrılıyor")
                    result = await session.list_tools()
                    logger.info("[mcp_client.list_tools] ← session.list_tools() döndü")
                    
                    # Extract tools from result
                    if hasattr(result, 'tools'):
                        tools = [tool.model_dump() if hasattr(tool, 'model_dump') else tool for tool in result.tools]
                        logger.info(f"[mcp_client.list_tools] {len(tools)} tool extract edildi")
                        return tools
                    logger.warning("[mcp_client.list_tools] result.tools attribute'u yok, result direkt döndürülüyor")
                    return result
        except Exception as e:
            logger.error(f"[mcp_client.list_tools] Hata oluştu: {type(e).__name__}: {str(e)}")
            if "401" in str(e) or "Unauthorized" in str(e):
                logger.error("[mcp_client.list_tools] 401 Unauthorized - Token geçersiz veya süresi dolmuş olabilir. GITHUB_TOKEN'ı kontrol edin.")
            raise

    async def call_tool(self, name: str, arguments: dict):
        """Call an MCP tool"""
        logger.info(f"[mcp_client.call_tool] Başlangıç - tool: {name}, arguments: {arguments}")
        
        if not self.token:
            logger.error("[mcp_client.call_tool] GITHUB_TOKEN bulunamadı! .env dosyasını kontrol edin.")
            raise ValueError("GITHUB_TOKEN environment variable bulunamadı")
        
        headers = {}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"  # Tam token'ı kullan
            logger.info(f"[mcp_client.call_tool] Authorization header eklendi (token başı: {self.token[:20]}...)")
        else:
            logger.warning("[mcp_client.call_tool] Token yok, Authorization header eklenmedi")
        
        logger.info("[mcp_client.call_tool] → create_mcp_http_client() çağrılıyor")
        http_client = create_mcp_http_client(headers=headers)
        logger.info("[mcp_client.call_tool] → streamable_http_client() bağlantısı açılıyor")
        
        try:
            async with streamable_http_client(self.url, http_client=http_client) as (read_stream, write_stream, _):
                logger.info("[mcp_client.call_tool] → ClientSession oluşturuluyor")
                client_info = types.Implementation(name="github-chat-backend", version="1.0.0")
                async with ClientSession(read_stream, write_stream, client_info=client_info) as session:
                    logger.info("[mcp_client.call_tool] → session.initialize() çağrılıyor")
                    await session.initialize()
                    logger.info("[mcp_client.call_tool] ← session.initialize() tamamlandı")
                    
                    logger.info(f"[mcp_client.call_tool] → session.call_tool(name='{name}') çağrılıyor")
                    result = await session.call_tool(name=name, arguments=arguments)
                    logger.info(f"[mcp_client.call_tool] ← session.call_tool() döndü: result_type={type(result).__name__}")
                    
                    # Extract content from result - MCP returns ToolResult with content array
                    if hasattr(result, 'content'):
                        logger.info(f"[mcp_client.call_tool] result.content var, {len(result.content)} item")
                        content_items = result.content
                        parsed_content = []
                        for item in content_items:
                            if hasattr(item, 'text'):
                                parsed_content.append({"text": item.text})
                            elif hasattr(item, 'model_dump'):
                                parsed_content.append(item.model_dump())
                            else:
                                parsed_content.append(str(item))
                        final_result = parsed_content if len(parsed_content) > 1 else (parsed_content[0] if parsed_content else {})
                        logger.info(f"[mcp_client.call_tool] Parse edildi, {len(parsed_content)} item")
                        return final_result
                    
                    # Fallback: try to convert to dict if it's a Pydantic model
                    if hasattr(result, 'model_dump'):
                        logger.info("[mcp_client.call_tool] result.model_dump() kullanılıyor")
                        return result.model_dump()
                    
                    logger.info("[mcp_client.call_tool] result direkt döndürülüyor")
                    return result
        except Exception as e:
            logger.error(f"[mcp_client.call_tool] Hata oluştu: {type(e).__name__}: {str(e)}")
            if "401" in str(e) or "Unauthorized" in str(e):
                logger.error("[mcp_client.call_tool] 401 Unauthorized - Token geçersiz veya süresi dolmuş olabilir. GITHUB_TOKEN'ı kontrol edin.")
            raise