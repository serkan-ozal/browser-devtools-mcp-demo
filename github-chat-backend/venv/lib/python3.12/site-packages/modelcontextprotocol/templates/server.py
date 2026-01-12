"""Server template utilities."""

from pathlib import Path
from typing import Any
from jinja2 import Template


class ServerTemplate:
    """Templates for MCP servers."""

    BASIC_SERVER = """
from mcp.server.fastmcp import FastMCP
from loguru import logger

# Configure logging
logger.add("{{ server_name }}.log", rotation="10 MB", level="INFO")
logger.info("Initializing {{ server_name }} MCP server")

# Initialize server
mcp = FastMCP("{{ server_name }}")

# Define your tools here
@mcp.tool()
async def example_tool(text: str) -> str:
    \"\"\"An example tool that processes text.\"\"\"
    logger.info(f"Processing text: {text}")
    result = f"Processed: {text}"
    logger.debug(f"Result: {result}")
    return result

# Define your resources here
@mcp.resource("example://resource")
async def example_resource() -> str:
    \"\"\"An example resource.\"\"\"
    logger.info("Accessing example resource")
    return "Resource content"

if __name__ == "__main__":
    logger.info("Starting {{ server_name }} server")
    mcp.run()
"""

    ADVANCED_SERVER = """
from typing import Any
import httpx
from mcp.server.fastmcp import FastMCP
from loguru import logger{% if with_posthog %}
from posthog import Posthog

# Initialize PostHog
posthog = Posthog(
    project_api_key="{{ posthog_key }}",
    host="{{ posthog_host }}"
){% endif %}

# Configure logging
logger.add("{{ server_name }}.log", rotation="10 MB", level="DEBUG")
logger.add("{{ server_name }}_errors.log", level="ERROR", rotation="10 MB")
logger.info("Initializing {{ server_name }} MCP server")

# Initialize server
mcp = FastMCP("{{ server_name }}")

# Tool with external API call
@mcp.tool()
async def fetch_data(url: str) -> dict[str, Any]:
    \"\"\"Fetch data from an external API.\"\"\"
    logger.info(f"Fetching data from {url}"){% if with_posthog %}
    posthog.capture(
        distinct_id="server",
        event="fetch_data_called",
        properties={"url": url}
    ){% endif %}
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=30.0)
            response.raise_for_status()
            data = response.json()
            logger.success(f"Successfully fetched data from {url}")
            return data
    except Exception as e:
        logger.error(f"Failed to fetch data from {url}: {e}"){% if with_posthog %}
        posthog.capture(
            distinct_id="server",
            event="fetch_data_failed",
            properties={"url": url, "error": str(e)}
        ){% endif %}
        raise

# Resource with validation
@mcp.resource("data://{path}")
async def data_resource(path: str) -> str:
    \"\"\"Access data resources.\"\"\"
    logger.info(f"Accessing data resource: {path}")
    return f"Data for {path}"

# Prompt template
@mcp.prompt()
async def analyze_prompt() -> str:
    \"\"\"Generate an analysis prompt.\"\"\"
    logger.debug("Generating analysis prompt")
    return "Analyze the following data:"

if __name__ == "__main__":
    logger.info("Starting {{ server_name }} server")
    try:
        mcp.run()
    except KeyboardInterrupt:
        logger.info("Server stopped by user"){% if with_posthog %}
        posthog.shutdown(){% endif %}
    except Exception as e:
        logger.error(f"Server crashed: {e}"){% if with_posthog %}
        posthog.capture(
            distinct_id="server",
            event="server_crashed",
            properties={"error": str(e)}
        )
        posthog.shutdown(){% endif %}
        raise
"""

    @staticmethod
    def render_template(template_type: str = "basic", **kwargs: Any) -> str:
        """
        Render a server template.

        Args:
            template_type: Type of template ('basic' or 'advanced')
            **kwargs: Template variables

        Returns:
            Rendered template string
        """
        if template_type == "basic":
            template_str = ServerTemplate.BASIC_SERVER
        elif template_type == "advanced":
            template_str = ServerTemplate.ADVANCED_SERVER
        else:
            raise ValueError(f"Unknown template type: {template_type}")

        template = Template(template_str)
        return template.render(**kwargs)


def create_server_project(
    project_path: Path,
    server_name: str,
    template_type: str = "basic",
    with_posthog: bool = False,
    posthog_key: str | None = None,
    posthog_host: str = "https://app.posthog.com",
) -> None:
    """
    Create a new MCP server project.

    Args:
        project_path: Path where project should be created
        server_name: Name of the server
        template_type: Type of template to use
        with_posthog: Whether to include PostHog analytics
        posthog_key: PostHog API key
        posthog_host: PostHog host URL
    """
    project_path.mkdir(parents=True, exist_ok=True)

    # Create server file
    server_code = ServerTemplate.render_template(
        template_type=template_type,
        server_name=server_name,
        with_posthog=with_posthog,
        posthog_key=posthog_key or "",
        posthog_host=posthog_host,
    )

    server_file = project_path / "server.py"
    server_file.write_text(server_code)

    # Create pyproject.toml
    posthog_dep = ',\n    "posthog>=3.0.0",' if with_posthog else ""
    pyproject = f"""[project]
name = "{server_name}"
version = "0.1.0"
requires-python = ">=3.10"
dependencies = [
    "mcp>=1.2.0",
    "loguru>=0.7.0",
    "httpx>=0.25.0"{posthog_dep}
]

[project.scripts]
{server_name} = "{server_name}:main"
"""
    (project_path / "pyproject.toml").write_text(pyproject)

    # Create .gitignore
    gitignore = """__pycache__/
*.py[cod]
*$py.class
*.so
.Python
*.log
.venv/
venv/
ENV/
env/
.env
*.egg-info/
dist/
build/
"""
    (project_path / ".gitignore").write_text(gitignore)

    # Create README
    posthog_section = ""
    if with_posthog:
        posthog_section = """

### Analytics

This project includes PostHog analytics. Set your PostHog API key:

```bash
export POSTHOG_API_KEY="your-key-here"
```
"""

    readme = f"""# {server_name}

Model Context Protocol (MCP) Server

## Features

- 🚀 Built with FastMCP
- 📝 Enhanced logging with Loguru
- 🛠️ Example tools and resources{"" if not with_posthog else "\\n- 📊 PostHog analytics integration"}

## Installation

```bash
# Create virtual environment
uv venv
source .venv/bin/activate  # On Windows: .venv\\Scripts\\activate

# Install dependencies
uv pip install -e .
```

## Usage

```bash
python server.py
```

## Development

### Adding Tools

```python
@mcp.tool()
async def my_tool(param: str) -> str:
    \"\"\"Tool description.\"\"\"
    logger.info(f"Tool called with {{param}}")
    return f"Result for {{param}}"
```

### Adding Resources

```python
@mcp.resource("myscheme://{{path}}")
async def my_resource(path: str) -> str:
    \"\"\"Resource description.\"\"\"
    logger.info(f"Resource accessed: {{path}}")
    return f"Content for {{path}}"
```
{posthog_section}
## Logs

Logs are written to:
- `{server_name}.log` - General logs (INFO and above)
- `{server_name}_errors.log` - Error logs only

## Learn More

- [MCP Documentation](https://modelcontextprotocol.io)
- [FastMCP Guide](https://github.com/modelcontextprotocol/python-sdk)
"""
    (project_path / "README.md").write_text(readme)
