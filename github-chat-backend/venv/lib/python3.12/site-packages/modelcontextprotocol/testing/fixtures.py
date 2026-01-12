"""
Common test fixtures for MCP testing.
"""

from typing import Dict, List, Any
import pytest
from mcp.types import Tool, Resource


@pytest.fixture
def mock_server():
    """Fixture providing a mock MCP server for testing."""
    class MockServer:
        def __init__(self):
            self.tools = []
            self.resources = []
            self.prompts = []
        
        async def call_tool(self, name: str, arguments: Dict[str, Any]) -> Any:
            return {"result": "mock_response"}
        
        async def read_resource(self, uri: str) -> Any:
            return {"content": "mock_content"}
    
    return MockServer()


@pytest.fixture
def mock_client():
    """Fixture providing a mock MCP client for testing."""
    class MockClient:
        def __init__(self):
            self.connected = False
        
        async def connect(self, uri: str) -> None:
            self.connected = True
        
        async def disconnect(self) -> None:
            self.connected = False
    
    return MockClient()


@pytest.fixture
def sample_tools() -> List[Tool]:
    """Fixture providing sample tool definitions for testing."""
    return [
        Tool(
            name="sample_tool",
            description="A sample tool for testing",
            inputSchema={
                "type": "object",
                "properties": {
                    "param1": {"type": "string"},
                    "param2": {"type": "number"},
                },
                "required": ["param1"],
            },
        ),
        Tool(
            name="another_tool",
            description="Another sample tool",
            inputSchema={
                "type": "object",
                "properties": {
                    "input": {"type": "string"},
                },
            },
        ),
    ]


@pytest.fixture
def sample_resources() -> List[Resource]:
    """Fixture providing sample resource definitions for testing."""
    return [
        Resource(
            uri="test://resource1",
            name="Sample Resource 1",
            description="A sample resource for testing",
            mimeType="text/plain",
        ),
        Resource(
            uri="test://resource2",
            name="Sample Resource 2",
            description="Another sample resource",
            mimeType="application/json",
        ),
    ]
