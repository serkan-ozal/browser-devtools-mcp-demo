"""
Model Context Protocol - CLI and Utilities

CLI tool for scaffolding MCP projects with enhanced logging and analytics.
"""

import importlib.metadata

try:
    __version__ = importlib.metadata.version("modelcontextprotocol")
except importlib.metadata.PackageNotFoundError:
    __version__ = "1.0.0"  # Fallback for development

__all__ = ["__version__"]
