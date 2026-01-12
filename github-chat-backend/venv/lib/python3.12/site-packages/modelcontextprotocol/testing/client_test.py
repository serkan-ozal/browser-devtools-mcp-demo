"""
Test utilities for MCP clients.
"""

from typing import Any, Dict, List
import pytest


class ClientTestCase:
    """
    Base test case class for MCP clients.
    
    Provides utilities for testing client implementations including:
    - Server connection testing
    - Request/response validation
    - Error handling
    
    Example:
        ```python
        class TestMyClient(ClientTestCase):
            async def test_connect(self):
                await self.connect_to_server("test://server")
                assert self.is_connected()
        ```
    """
    
    async def connect_to_server(self, uri: str) -> None:
        """
        Connect to a test server.
        
        Args:
            uri: URI of the server to connect to
        """
        raise NotImplementedError("Implement based on your client structure")
    
    def is_connected(self) -> bool:
        """Check if client is connected to a server."""
        raise NotImplementedError("Implement based on your client structure")
    
    async def disconnect(self) -> None:
        """Disconnect from the server."""
        raise NotImplementedError("Implement based on your client structure")
