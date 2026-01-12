import logging
from mcp_client import GitHubMCPClient

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)


class ToolRegistry:
    def __init__(self):
        self.mcp = GitHubMCPClient()
        self._tools = None

    async def load_tools(self):
        """Load and cache MCP tools"""
        if self._tools is None:
            logger.info("[tool_registry.load_tools] Tool'lar yükleniyor (cache'de yok)")
            logger.info("[tool_registry.load_tools] → mcp.list_tools() çağrılıyor")
            self._tools = await self.mcp.list_tools()
            logger.info(f"[tool_registry.load_tools] ← mcp.list_tools() döndü: {len(self._tools)} tool")
        else:
            logger.debug(f"[tool_registry.load_tools] Cache'den döndürülüyor: {len(self._tools)} tool")
        return self._tools

    async def get_tools_by_category(self, category: str):
        """Get tools filtered by category"""
        logger.info(f"[tool_registry.get_tools_by_category] Başlangıç - category: {category}")
        logger.info("[tool_registry.get_tools_by_category] → load_tools() çağrılıyor")
        tools = await self.load_tools()
        logger.info(f"[tool_registry.get_tools_by_category] ← load_tools() döndü: {len(tools)} tool")
        
        # Filter tools by category name - check both name and description
        category_clean = category.replace("_", "").lower()
        category_with_underscore = category.lower()
        logger.debug(f"[tool_registry.get_tools_by_category] Filtreleme: category_clean='{category_clean}', category_with_underscore='{category_with_underscore}'")
        
        filtered = [
            t for t in tools
            if (
                category_clean in t.get("name", "").lower()
                or category_with_underscore in t.get("name", "").lower()
                or category_clean in t.get("description", "").lower()
                or category_with_underscore in t.get("description", "").lower()
            )
        ]
        logger.info(f"[tool_registry.get_tools_by_category] Filtreleme tamamlandı: {len(filtered)} tool bulundu")
        return filtered