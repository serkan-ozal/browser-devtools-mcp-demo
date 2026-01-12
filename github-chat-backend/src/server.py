"""
GitHub Chatbot - Main Entry Point

This module serves as the entry point for the GitHub chatbot application.
It can run in either CLI mode (--cli flag) or HTTP server mode (default).

Usage:
    python -m src.main          # Start HTTP server
    python -m src.main --cli    # Start CLI interface
"""

import sys
import asyncio
from typing import Optional

from dotenv import load_dotenv

from .agent import create_agent, AgentHandle
from .server import start_server_async
from .cli import run_cli

load_dotenv()


def has_arg(name: str) -> bool:
    """Check if a command line argument exists."""
    return name in sys.argv


async def main() -> None:
    """Main entry point for the application."""
    # Create the agent
    handle: AgentHandle = await create_agent()
    agent = handle.agent
    close = handle.close

    try:
        if has_arg("--cli"):
            # Run CLI mode
            await run_cli(agent)
        else:
            # Run HTTP server mode (async)
            await start_server_async(agent)
    except asyncio.CancelledError:
        print("\nShutting down gracefully...")
    except KeyboardInterrupt:
        print("\nShutting down...")
    finally:
        await close()


def run() -> None:
    """Synchronous entry point."""
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nGoodbye!")
        sys.exit(0)
    except Exception as err:
        print(f"Fatal startup error: {err}")
        sys.exit(1)


if __name__ == "__main__":
    run()