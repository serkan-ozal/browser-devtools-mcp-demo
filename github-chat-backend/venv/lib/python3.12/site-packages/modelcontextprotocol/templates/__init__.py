"""
Server and client templates for quick MCP project setup.

Provides:
- Pre-built server templates
- Client templates
- Project scaffolding
"""

from .server import ServerTemplate, create_server_project
from .client import ClientTemplate, create_client_project

__all__ = [
    "ServerTemplate",
    "create_server_project",
    "ClientTemplate",
    "create_client_project",
]
