"""Message validation utilities."""

from typing import Any, Dict, Optional


class MessageValidator:
    """Validates MCP protocol messages."""

    @staticmethod
    def validate_request(message: Dict[str, Any]) -> bool:
        """Validate a request message."""
        if "method" not in message:
            raise ValueError("Request must have 'method' field")
        if "id" not in message:
            raise ValueError("Request must have 'id' field")
        return True

    @staticmethod
    def validate_response(message: Dict[str, Any]) -> bool:
        """Validate a response message."""
        if "id" not in message:
            raise ValueError("Response must have 'id' field")
        if "result" not in message and "error" not in message:
            raise ValueError("Response must have 'result' or 'error'")
        return True

    @staticmethod
    def validate_notification(message: Dict[str, Any]) -> bool:
        """Validate a notification message."""
        if "method" not in message:
            raise ValueError("Notification must have 'method' field")
        if "id" in message:
            raise ValueError("Notification must not have 'id' field")
        return True
