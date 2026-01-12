"""URI validation utilities."""

from typing import Optional
from urllib.parse import urlparse


class URIValidator:
    """Validates URIs for MCP resources."""

    VALID_SCHEMES = [
        "file",
        "http",
        "https",
        "ftp",
        "git",
        "ssh",
        "data",
        "custom",
    ]

    @staticmethod
    def validate_uri(uri: str, allowed_schemes: Optional[list] = None) -> bool:
        """
        Validate a URI.

        Args:
            uri: The URI to validate
            allowed_schemes: List of allowed schemes (default: all standard)

        Returns:
            True if valid

        Raises:
            ValueError: If URI is invalid
        """
        if not uri:
            raise ValueError("URI cannot be empty")

        parsed = urlparse(uri)

        if not parsed.scheme:
            raise ValueError(f"URI must have a scheme: {uri}")

        schemes = allowed_schemes or URIValidator.VALID_SCHEMES
        if parsed.scheme not in schemes:
            raise ValueError(f"Invalid URI scheme: {parsed.scheme}")

        return True


def validate_uri(uri: str, allowed_schemes: Optional[list] = None) -> bool:
    """
    Convenience function to validate a URI.

    Args:
        uri: The URI to validate
        allowed_schemes: List of allowed schemes

    Returns:
        True if valid

    Raises:
        ValueError: If URI is invalid
    """
    return URIValidator.validate_uri(uri, allowed_schemes)
