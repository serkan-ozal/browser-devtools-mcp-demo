"""Client template utilities."""

from pathlib import Path
from typing import Any
from jinja2 import Template


class ClientTemplate:
    """Templates for MCP clients."""

    BASIC_CLIENT = """
import asyncio
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

async def main():
    server_params = StdioServerParameters(
        command="python",
        args=["server.py"],
    )

    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            # Initialize the connection
            await session.initialize()

            # List available tools
            tools = await session.list_tools()
            print(f"Available tools: {[t.name for t in tools.tools]}")

            # Call a tool
            result = await session.call_tool("example_tool", {"text": "test"})
            print(f"Tool result: {result}")

if __name__ == "__main__":
    asyncio.run(main())
"""

    @staticmethod
    def render_template(**kwargs: Any) -> str:
        """Render a client template."""
        template = Template(ClientTemplate.BASIC_CLIENT)
        return template.render(**kwargs)


def create_client_project(
    project_path: Path,
    client_name: str = "mcp-client",
) -> None:
    """
    Create a new MCP client project.

    Args:
        project_path: Path where project should be created
        client_name: Name of the client
    """
    project_path.mkdir(parents=True, exist_ok=True)

    # Create client file
    client_code = ClientTemplate.render_template()
    client_file = project_path / "client.py"
    client_file.write_text(client_code)

    # Create pyproject.toml
    pyproject = f"""[project]
name = "{client_name}"
version = "0.1.0"
requires-python = ">=3.10"
dependencies = [
    "mcp>=1.2.0",
    "modelcontextprotocol>=1.0.0",
]
"""
    (project_path / "pyproject.toml").write_text(pyproject)

    print(f"✅ Created MCP client project at {project_path}")
