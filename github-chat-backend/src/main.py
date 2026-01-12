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
import signal
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

    # Setup graceful shutdown
    loop = asyncio.get_event_loop()

    def signal_handler():
        """Handle SIGINT and SIGTERM."""
        print("\nShutting down...")
        asyncio.create_task(close())
        loop.stop()

    # Register signal handlers
    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, signal_handler)

    try:
        if has_arg("--cli"):
            # Run CLI mode
            await run_cli(agent)
            await close()
        else:
            # Run HTTP server mode (async)
            await start_server_async(agent)
    except Exception as err:
        print(f"Error: {err}")
        await close()
        raise


def run() -> None:
    """Synchronous entry point."""
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nGoodbye!")
    except Exception as err:
        print(f"Fatal startup error: {err}")
        sys.exit(1)


if __name__ == "__main__":
    run()