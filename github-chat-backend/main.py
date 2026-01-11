from fastapi import FastAPI
from pydantic import BaseModel
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

# .env'yi EN BAŞTA yükle
load_dotenv()

# Agent fonksiyonlarını import et
from agent import run_agent, run_agent_stream

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React Project
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str


# -----------------------------
# NORMAL CHAT (JSON RESPONSE)
# -----------------------------
@app.post("/chat")
async def chat(req: ChatRequest):
    reply = await run_agent(req.message)
    return {"reply": reply}


# -----------------------------
# STREAMING CHAT
# -----------------------------
@app.post("/chat-stream")
async def chat_stream(req: ChatRequest):

    async def generator():
        async for chunk in run_agent_stream(req.message):
            yield chunk

    return StreamingResponse(generator(), media_type="text/plain")