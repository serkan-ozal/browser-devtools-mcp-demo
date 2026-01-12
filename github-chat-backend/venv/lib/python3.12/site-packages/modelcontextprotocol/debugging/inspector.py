"""Message inspection utilities."""

from typing import Any, Dict
from rich.console import Console
from rich.syntax import Syntax
from rich.panel import Panel
import json


class Inspector:
    """Inspects and displays MCP messages."""

    def __init__(self):
        self.console = Console()

    def inspect_message(
        self, message: Dict[str, Any], title: str = "MCP Message"
    ) -> None:
        """
        Display a formatted MCP message.

        Args:
            message: The message to inspect
            title: Title for the display panel
        """
        json_str = json.dumps(message, indent=2)
        syntax = Syntax(json_str, "json", theme="monokai", line_numbers=True)

        self.console.print(Panel(syntax, title=title, border_style="blue"))

    def inspect_tool_call(
        self, tool_name: str, arguments: Dict[str, Any], result: Any = None
    ) -> None:
        """
        Display a tool call with its arguments and result.

        Args:
            tool_name: Name of the tool
            arguments: Tool arguments
            result: Tool result (optional)
        """
        self.console.print(f"\n[bold cyan]Tool Call:[/] {tool_name}")

        args_json = json.dumps(arguments, indent=2)
        args_syntax = Syntax(args_json, "json", theme="monokai")
        self.console.print(
            Panel(args_syntax, title="Arguments", border_style="green")
        )

        if result is not None:
            result_json = json.dumps(result, indent=2)
            result_syntax = Syntax(result_json, "json", theme="monokai")
            self.console.print(
                Panel(result_syntax, title="Result", border_style="yellow")
            )


# Global inspector instance
_inspector = Inspector()


def message_inspector(message: Dict[str, Any], title: str = "MCP Message") -> None:
    """
    Convenience function to inspect a message.

    Args:
        message: The message to inspect
        title: Title for the display
    """
    _inspector.inspect_message(message, title)
