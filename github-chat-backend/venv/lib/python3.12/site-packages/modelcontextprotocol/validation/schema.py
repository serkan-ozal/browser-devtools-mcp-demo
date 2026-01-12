"""Schema validation utilities."""

from typing import Any, Dict
import jsonschema
from jsonschema import Draft7Validator


class SchemaValidator:
    """Validates JSON schemas and data against schemas."""

    @staticmethod
    def validate_tool_schema(schema: Dict[str, Any]) -> bool:
        """
        Validate that a tool's input schema is valid JSON Schema.

        Args:
            schema: The schema to validate

        Returns:
            True if valid

        Raises:
            jsonschema.SchemaError: If schema is invalid
        """
        Draft7Validator.check_schema(schema)
        return True

    @staticmethod
    def validate_data(data: Any, schema: Dict[str, Any]) -> bool:
        """
        Validate data against a JSON schema.

        Args:
            data: The data to validate
            schema: The schema to validate against

        Returns:
            True if valid

        Raises:
            jsonschema.ValidationError: If validation fails
        """
        jsonschema.validate(instance=data, schema=schema)
        return True


def validate_tool_schema(schema: Dict[str, Any]) -> bool:
    """
    Convenience function to validate a tool schema.

    Args:
        schema: The schema to validate

    Returns:
        True if valid

    Raises:
        jsonschema.SchemaError: If schema is invalid
    """
    return SchemaValidator.validate_tool_schema(schema)


def validate_message(message: Dict[str, Any]) -> bool:
    """
    Validate an MCP protocol message structure.

    Args:
        message: The message to validate

    Returns:
        True if valid

    Raises:
        ValueError: If message is invalid
    """
    if "jsonrpc" not in message:
        raise ValueError("Message must have 'jsonrpc' field")

    if message.get("jsonrpc") != "2.0":
        raise ValueError("Message must use JSON-RPC 2.0")

    if "method" in message and "id" not in message:
        # Notification
        pass
    elif "id" in message and "method" in message:
        # Request
        pass
    elif "id" in message and ("result" in message or "error" in message):
        # Response
        pass
    else:
        raise ValueError("Message must be a valid JSON-RPC message")

    return True
