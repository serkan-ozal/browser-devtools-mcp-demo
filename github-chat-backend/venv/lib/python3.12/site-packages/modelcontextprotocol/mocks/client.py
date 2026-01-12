"""Mock MCP client for testing."""

from typing import Any, Dict, List


class MockClient:
    """
    A mock MCP client for testing.

    Simulates client behavior for server testing.
    """

    def __init__(self):
        self.connected = False
        self.requests: List[Dict[str, Any]] = []

    async def connect(self, uri: str) -> None:
        """Mock connection."""
        self.connected = True
        self.requests.append({"type": "connect", "uri": uri})

    async def disconnect(self) -> None:
        """Mock disconnection."""
        self.connected = False
        self.requests.append({"type": "disconnect"})

    async def send_request(
        self,
        method: str,
        params: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Mock request sending."""
        self.requests.append({
            "type": "request",
            "method": method,
            "params": params,
        })
        return {"result": "mock_response"}

    def verify_request(
        self,
        method: str,
        times: int = 1,
    ) -> bool:
        """Verify a request was sent a specific number of times."""
        actual = sum(
            1 for req in self.requests
            if req.get("type") == "request" and req.get("method") == method
        )
        return actual == times

    def reset(self) -> None:
        """Reset all recorded requests."""
        self.requests.clear()
