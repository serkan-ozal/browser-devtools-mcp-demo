import os
from typing import Any

from langchain_core.messages import HumanMessage, AIMessage, BaseMessage


def get_last_assistant_text(messages: list[BaseMessage]) -> str:
    """Get the last assistant message text from message list."""
    for m in reversed(messages):
        if isinstance(m, AIMessage):
            content = m.content
            if isinstance(content, str):
                return content
            return str(content)
    return "(no assistant message)"


async def run_cli(agent: Any) -> None:
    """
    Run the interactive CLI chatbot.

    Args:
        agent: The compiled LangGraph agent.
    """
    thread_id = os.getenv("SESSION_ID", "") or "cli-thread"

    print("CLI chatbot ready. Type 'exit' to quit.")
    print(f"thread_id: {thread_id}")

    while True:
        try:
            # Get user input
            user_input = input("\nYou> ").strip()

            if not user_input:
                continue

            if user_input.lower() == "exit":
                break

            # Invoke the agent
            state = await agent.ainvoke(
                {"messages": [HumanMessage(content=user_input)]},
                config={"configurable": {"thread_id": thread_id}},
            )

            # Get and print the response
            answer = get_last_assistant_text(state["messages"])
            print(f"\nBot> {answer}")

        except KeyboardInterrupt:
            print("\nGoodbye!")
            break
        except EOFError:
            print("\nGoodbye!")
            break