"""
Testing utilities for MCP servers and clients.

This module provides tools to simplify testing MCP implementations:
- ServerTestCase: Base class for testing MCP servers
- ClientTestCase: Base class for testing MCP clients
- assert_* helpers: Convenient assertion methods
- fixtures: Common test fixtures
"""

from .server_test import ServerTestCase, assert_tool_result, assert_resource_content
from .client_test import ClientTestCase
from .fixtures import mock_server, mock_client, sample_tools, sample_resources

__all__ = [
    "ServerTestCase",
    "ClientTestCase",
    "assert_tool_result",
    "assert_resource_content",
    "mock_server",
    "mock_client",
    "sample_tools",
    "sample_resources",
]
