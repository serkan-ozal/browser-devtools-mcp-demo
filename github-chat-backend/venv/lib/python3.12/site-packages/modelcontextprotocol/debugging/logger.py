"""Logging utilities for MCP."""

import logging
import sys
from typing import Optional


class MCPLogger:
    """Logger configured for MCP applications."""

    def __init__(self, name: str = "mcp", level: int = logging.INFO):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(level)

        # Ensure we don't duplicate handlers
        if not self.logger.handlers:
            handler = logging.StreamHandler(sys.stderr)
            formatter = logging.Formatter(
                "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
            )
            handler.setFormatter(formatter)
            self.logger.addHandler(handler)

    def debug(self, message: str) -> None:
        """Log a debug message."""
        self.logger.debug(message)

    def info(self, message: str) -> None:
        """Log an info message."""
        self.logger.info(message)

    def warning(self, message: str) -> None:
        """Log a warning message."""
        self.logger.warning(message)

    def error(self, message: str) -> None:
        """Log an error message."""
        self.logger.error(message)

    def critical(self, message: str) -> None:
        """Log a critical message."""
        self.logger.critical(message)


def setup_logging(
    name: str = "mcp",
    level: int = logging.INFO,
    format_string: Optional[str] = None,
) -> MCPLogger:
    """
    Setup logging for MCP applications.

    Args:
        name: Logger name
        level: Logging level
        format_string: Optional custom format string

    Returns:
        Configured MCPLogger instance
    """
    logger = MCPLogger(name, level)

    if format_string:
        for handler in logger.logger.handlers:
            handler.setFormatter(logging.Formatter(format_string))

    return logger
