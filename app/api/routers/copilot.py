from __future__ import annotations

import os

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.agents.copilot import CopilotAgent


router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    history: list[dict[str, str]] = []


@router.post("/chat")
async def copilot_chat(request: ChatRequest):
    """Chat with the System Copilot (Gemini-powered).
    Can perform system actions if authorized.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured on server")

    # In production, we should inject the workspace root from config
    # For now, defaulting to /app/app (container path) or /opt/predator
    workspace = "/app/app" if os.path.exists("/app/app") else "."

    agent = CopilotAgent(api_key=api_key, workspace_root=workspace)

    try:
        response = await agent.chat(request.message, request.history)
        return {"response": response, "agent": "GeminiCopilot v1.0"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
