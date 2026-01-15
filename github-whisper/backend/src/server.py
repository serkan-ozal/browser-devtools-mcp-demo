import os
import json
from typing import Any, AsyncGenerator

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from langchain_core.messages import HumanMessage, AIMessage, BaseMessage

import uvicorn

# Utility Functions

def content_to_string(content: Any) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return "\n".join(content_to_string(c) for c in content)
    if isinstance(content, dict) and "text" in content:
        return str(content["text"])
    return ""


def extract_assistant_text_from_chunk(chunk: Any) -> str:
    """
    Extract the latest assistant text delta from a LangGraph stream chunk.
    Handles nested structure like {'agent': {'messages': [...]}}
    """
    if not chunk or not isinstance(chunk, dict):
        return ""

    # Handle nested structure: {'agent': {'messages': [...]}} or {'pre_extract': ...}
    msgs = None

    # Try direct messages key
    if "messages" in chunk:
        msgs = chunk["messages"]
    else:
        # Try nested keys like 'agent', 'tools', etc.
        for key, value in chunk.items():
            if isinstance(value, dict) and "messages" in value:
                msgs = value["messages"]
                break

    if not isinstance(msgs, list) or len(msgs) == 0:
        return ""

    last = msgs[-1]
    if not last:
        return ""

    # If it's an AIMessage instance
    if isinstance(last, AIMessage):
        return content_to_string(last.content).strip()

    # If it's a dict representation
    if isinstance(last, dict):
        role = last.get("role", "")
        if role and role != "assistant":
            return ""
        content = last.get("content", "")
        return content_to_string(content).strip()

    return ""


# Request/Response Models

class ChatRequest(BaseModel):
    threadId: str
    message: str


class HealthResponse(BaseModel):
    status: str = "ok"


# Server Factory

def create_app(agent: Any) -> FastAPI:
    app = FastAPI(
        title="GitHub Chatbot",
        description="GitHub-aware chatbot using LangChain, LangGraph, and MCP",
        version="1.0.0",
    )

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health", response_model=HealthResponse)
    async def health_check():
        """Health check endpoint."""
        return HealthResponse(status="ok")

    @app.post("/chat")
    async def chat(request: ChatRequest):
        """
        Chat endpoint with SSE streaming.

        Streams assistant responses as Server-Sent Events.
        """
        if not request.threadId:
            raise HTTPException(status_code=400, detail="threadId is required")

        if not request.message:
            raise HTTPException(status_code=400, detail="message is required")

        async def event_generator() -> AsyncGenerator[dict, None]:
            """Generate SSE events from agent stream."""
            try:
                print(f"[DEBUG] Starting stream for thread: {request.threadId}")
                print(f"[DEBUG] Message: {request.message}")

                stream = agent.astream(
                    {"messages": [HumanMessage(content=request.message)]},
                    config={"configurable": {"thread_id": request.threadId}},
                )

                async for chunk in stream:
                    print(f"[DEBUG] Chunk received: {type(chunk)} - {chunk}")
                    assistant_text = extract_assistant_text_from_chunk(chunk)

                    if assistant_text:
                        print(f"[DEBUG] Assistant text: {assistant_text}")
                        yield {
                            "event": "assistant",
                            "data": json.dumps({"message": assistant_text}),
                        }

                print("[DEBUG] Stream completed")
                yield {
                    "event": "end",
                    "data": "{}",
                }

            except Exception as err:
                import traceback
                print(f"[ERROR] Exception: {err}")
                print(f"[ERROR] Traceback: {traceback.format_exc()}")
                msg = str(err)
                yield {
                    "event": "error",
                    "data": json.dumps({"error": msg}),
                }

        return EventSourceResponse(event_generator())

    return app


async def start_server_async(agent: Any) -> None:
    import uvicorn

    app = create_app(agent)
    port = int(os.getenv("PORT", "3000"))

    print(f"SSE chatbot running at http://localhost:{port}")

    config = uvicorn.Config(app, host="0.0.0.0", port=port, log_level="info")
    server = uvicorn.Server(config)
    await server.serve()


def start_server(agent: Any) -> None:
    """
    Start the HTTP server (sync wrapper).

    Args:
        agent: The compiled LangGraph agent.
    """
    import uvicorn

    app = create_app(agent)
    port = int(os.getenv("PORT", "3000"))

    print(f"SSE chatbot running at http://localhost:{port}")

    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
