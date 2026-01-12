"""
Test utilities for MCP servers.
"""

from typing import Any, Dict, List, Optional
import pytest
from mcp.server import Server
from mcp.types import Tool, Resource, CallToolResult, ReadResourceResult


class ServerTestCase:
    """
    Base test case class for MCP servers.
    
    Provides utilities for testing server implementations including:
    - Tool invocation testing
    - Resource reading testing
    - Capability verification
    - Error handling validation
    
    Example:
        ```python
        class TestMyServer(ServerTestCase):
            async def test_tool_call(self):
                result = await self.call_tool("my_tool", {"arg": "value"})
                assert_tool_result(result, expected_type="text")
        ```
    """
    
    server: Server
    
    async def call_tool(
        self,
        tool_name: str,
        arguments: Dict[str, Any],
    ) -> CallToolResult:
        """
        Call a tool on the server and return the result.
        
        Args:
            tool_name: Name of the tool to call
            arguments: Dictionary of arguments to pass to the tool
            
        Returns:
            The tool call result
        """
        from mcp.types import CallToolRequest
        
        request = CallToolRequest(
            method="tools/call",
            params={
                "name": tool_name,
                "arguments": arguments,
            },
        )
        
        # This would be implemented based on actual server testing patterns
        raise NotImplementedError("Implement based on your server structure")
    
    async def read_resource(self, uri: str) -> ReadResourceResult:
        """
        Read a resource from the server.
        
        Args:
            uri: URI of the resource to read
            
        Returns:
            The resource contents
        """
        raise NotImplementedError("Implement based on your server structure")
    
    async def list_tools(self) -> List[Tool]:
        """List all available tools from the server."""
        raise NotImplementedError("Implement based on your server structure")
    
    async def list_resources(self) -> List[Resource]:
        """List all available resources from the server."""
        raise NotImplementedError("Implement based on your server structure")


def assert_tool_result(
    result: CallToolResult,
    expected_type: Optional[str] = None,
    expected_content: Optional[Any] = None,
    is_error: bool = False,
) -> None:
    """
    Assert properties of a tool call result.
    
    Args:
        result: The tool call result to check
        expected_type: Expected content type (text, image, etc.)
        expected_content: Expected content value
        is_error: Whether the result should be an error
        
    Raises:
        AssertionError: If assertions fail
    """
    if is_error:
        assert result.isError, "Expected error result"
    else:
        assert not result.isError, f"Unexpected error: {result}"
    
    if expected_type:
        assert any(
            getattr(content, "type", None) == expected_type
            for content in result.content
        ), f"Expected content type {expected_type}"
    
    if expected_content is not None:
        assert any(
            expected_content in str(content)
            for content in result.content
        ), f"Expected content containing {expected_content}"


def assert_resource_content(
    result: ReadResourceResult,
    expected_type: Optional[str] = None,
    expected_content: Optional[str] = None,
) -> None:
    """
    Assert properties of a resource read result.
    
    Args:
        result: The resource read result to check
        expected_type: Expected content type (text, blob)
        expected_content: Expected content substring
        
    Raises:
        AssertionError: If assertions fail
    """
    assert result.contents, "Resource has no contents"
    
    if expected_type:
        assert any(
            content.mimeType and expected_type in content.mimeType
            for content in result.contents
        ), f"Expected mime type containing {expected_type}"
    
    if expected_content is not None:
        assert any(
            expected_content in str(content)
            for content in result.contents
        ), f"Expected content containing {expected_content}"
