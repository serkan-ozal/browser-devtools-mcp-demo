"""
CLI for creating MCP projects with enhanced logging.
"""

import sys
from pathlib import Path
from typing import Optional

import click
from rich.console import Console
from rich.panel import Panel
from rich.prompt import Prompt, Confirm
from loguru import logger

from .templates import create_server_project
from .analytics import Analytics

console = Console()

# Configure loguru
logger.remove()  # Remove default handler
logger.add(
    sys.stderr,
    format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | <level>{message}</level>",
    colorize=True,
    level="INFO",
)


@click.group(invoke_without_command=True)
@click.pass_context
@click.version_option(version="1.0.0")
def main(ctx):
    """
    Model Context Protocol (MCP) Project Generator

    Create MCP servers and clients with enhanced logging and best practices.

    Usage:
        modelcontextprotocol create
        mcp-create server my-project
        uvx modelcontextprotocol create
    """
    if ctx.invoked_subcommand is None:
        # Interactive mode
        ctx.invoke(create)


@main.command()
@click.argument("name", required=False)
@click.option("--type", "-t", type=click.Choice(["server", "client"]), help="Project type")
@click.option(
    "--template", default="basic", type=click.Choice(["basic", "advanced"]), help="Template to use"
)
@click.option("--path", "-p", type=click.Path(), help="Project path")
@click.option("--posthog-key", envvar="POSTHOG_API_KEY", help="PostHog API key for analytics")
@click.option(
    "--posthog-host", envvar="POSTHOG_HOST", default="https://app.posthog.com", help="PostHog host"
)
def create(
    name: Optional[str],
    type: Optional[str],
    template: str,
    path: Optional[str],
    posthog_key: Optional[str],
    posthog_host: str,
):
    """Create a new MCP project."""

    # Initialize analytics (enabled by default, can be disabled via env var)
    analytics = Analytics(api_key=posthog_key, host=posthog_host)

    console.print(
        Panel.fit(
            "[bold cyan]Model Context Protocol[/]\n" "[dim]Project Generator[/]",
            border_style="cyan",
        )
    )

    # Interactive prompts if not provided
    if not name:
        name = Prompt.ask("📦 [bold]Project name[/]", default="my-mcp-project")

    if not type:
        type = Prompt.ask(
            "🔧 [bold]Project type[/]", choices=["server", "client"], default="server"
        )

    if not path:
        path = Prompt.ask("📁 [bold]Project path[/]", default=f"./{name}")

    project_path = Path(path).resolve()

    # Check if directory exists
    if project_path.exists():
        if not Confirm.ask(f"⚠️  Directory [yellow]{project_path}[/] exists. Continue?"):
            console.print("[red]❌ Cancelled[/]")
            return

    logger.info(f"Creating {type} project: {name}")

    # Track project creation (anonymized)
    analytics.track_event(
        "project_created",
        {
            "project_type": type,
            "template": template,
        },
    )

    try:
        if type == "server":
            create_server_project(
                project_path=project_path,
                server_name=name,
                template_type=template,
                with_posthog=posthog_key is not None,
                posthog_key=posthog_key,
                posthog_host=posthog_host,
            )
        else:
            from .templates import create_client_project

            create_client_project(
                project_path=project_path,
                client_name=name,
            )

        console.print(f"\n[bold green]✅ Successfully created {type} project![/]\n")
        console.print(
            Panel(
                f"[bold]Next steps:[/]\n\n"
                f"1. cd {project_path}\n"
                f"2. uv venv && source .venv/bin/activate  # or .venv\\Scripts\\activate on Windows\n"
                f"3. uv pip install -e .\n"
                f"4. python server.py  # Start your MCP server\n\n"
                f"[dim]See README.md for more information[/]",
                title="🚀 Getting Started",
                border_style="green",
            )
        )

        logger.success(f"Project created at {project_path}")

    except Exception as e:
        logger.error(f"Failed to create project: {e}")
        console.print(f"[red]❌ Error: {e}[/]")
        analytics.track_event(
            "project_creation_failed",
            {
                "error_type": e.__class__.__name__,
            },
        )
        sys.exit(1)


@main.command()
def examples():
    """Show usage examples."""
    console.print(
        Panel(
            "[bold]Usage Examples:[/]\n\n"
            "[cyan]# Interactive mode[/]\n"
            "modelcontextprotocol create\n\n"
            "[cyan]# Quick server creation[/]\n"
            "mcp-create server my-weather-server\n\n"
            "[cyan]# With uvx (no install needed)[/]\n"
            "uvx modelcontextprotocol create\n\n"
            "[cyan]# Advanced server with PostHog[/]\n"
            "mcp-create server my-server --template advanced --posthog-key YOUR_KEY\n\n"
            "[cyan]# Create client[/]\n"
            "mcp-create client my-client\n",
            title="💡 Examples",
            border_style="blue",
        )
    )


@main.command()
def version():
    """Show version information."""
    console.print("[bold cyan]modelcontextprotocol[/] version [yellow]1.0.0[/]")


if __name__ == "__main__":
    main()
