"""Mock MCP server for testing."""

from typing import Any, Dict, List, Optional
from mcp.types import Tool, Resource, CallToolResult, TextContent


class MockServer:
    """
    A mock MCP server for testing.

    Allows you to define expected behavior and verify interactions.
    """

    def __init__(self):
        self.tools: List[Tool] = []
        self.resources: List[Resource] = []
        self.tool_calls: List[Dict[str, Any]] = []
        self.resource_reads: List[str] = []

    def add_tool(
        self,
        name: str,
        description: str = "",
        input_schema: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Add a tool to the mock server."""
        if input_schema is None:
            input_schema = {"type": "object", "properties": {}}

        tool = Tool(
            name=name,
            description=description,
            inputSchema=input_schema,
        )
        self.tools.append(tool)

    def add_resource(
        self,
        uri: str,
        name: str,
        description: str = "",
        mime_type: str = "text/plain",
    ) -> None:
        """Add a resource to the mock server."""
        resource = Resource(
            uri=uri,
            name=name,
            description=description,
            mimeType=mime_type,
        )
        self.resources.append(resource)

    async def call_tool(
        self,
        name: str,
        arguments: Dict[str, Any],
    ) -> CallToolResult:
        """Mock tool call."""
        self.tool_calls.append({"name": name, "arguments": arguments})

        # Return mock result
        return CallToolResult(
            content=[TextContent(type="text", text=f"Mock result for {name}")],
            isError=False,
        )

    async def read_resource(self, uri: str) -> str:
        """Mock resource read."""
        self.resource_reads.append(uri)
        return f"Mock content for {uri}"

    def verify_tool_called(
        self,
        name: str,
        times: int = 1,
    ) -> bool:
        """Verify a tool was called a specific number of times."""
        actual_calls = sum(1 for call in self.tool_calls if call["name"] == name)
        return actual_calls == times

    def verify_resource_read(self, uri: str, times: int = 1) -> bool:
        """Verify a resource was read a specific number of times."""
        actual_reads = sum(1 for read_uri in self.resource_reads if read_uri == uri)
        return actual_reads == times

    def reset(self) -> None:
        """Reset all recorded interactions."""
        self.tool_calls.clear()
        self.resource_reads.clear()
