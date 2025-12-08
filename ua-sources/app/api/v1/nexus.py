
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from app.agents.orchestrator.supervisor import NexusSupervisor, get_nexus_supervisor
from app.core.config import settings
import logging

logger = logging.getLogger("api.nexus")

router = APIRouter(prefix="/nexus", tags=["Nexus Hivemind"])

class ChatRequest(BaseModel):
    query: str
    mode: str = "chat" # chat, auto, precise, council
    context: Optional[Dict[str, Any]] = None

@router.post("/chat")
async def chat_interaction(
    request: ChatRequest,
    supervisor: NexusSupervisor = Depends(get_nexus_supervisor)
):
    """
    Direct interface to Nexus Supervisor (The Brain).
    Supports Voice Interaction via text-to-text.
    
    Modes:
    - 'chat': Pure LLM conversation (Ollama/Llama-3)
    - 'auto': Standard RAG (Retriever + Miner)
    - 'council': Multi-Agent Debate
    """
    try:
        # Use singleton supervisor
        # supervisor = NexusSupervisor() <-- OLD
        
        logger.info(f"Nexus Chat Request: {request.query} [{request.mode}]")
        
        response = await supervisor.handle_request(
            user_query=request.query,
            mode=request.mode,
            request_context=request.context or {}
        )
        return response
        
    except Exception as e:
        logger.error(f"Nexus interaction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class SpeakRequest(BaseModel):
    text: str
    language: str = "uk-UA"
    gender: str = "NEUTRAL"

@router.post("/speak")
async def text_to_speech(
    request: SpeakRequest
):
    """
    Generate speech from text using Google Cloud TTS (or fallback).
    Returns audio content in base64.
    """
    import httpx
    
    if not settings.GOOGLE_TTS_API_KEY:
        raise HTTPException(status_code=503, detail="Google TTS API key not configured")

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://texttospeech.googleapis.com/v1/text:synthesize",
                headers={
                    "X-Goog-Api-Key": settings.GOOGLE_TTS_API_KEY,
                    "Content-Type": "application/json"
                },
                json={
                    "input": {"text": request.text},
                    "voice": {
                        "languageCode": request.language,
                        "ssmlGender": request.gender
                    },
                    "audioConfig": {"audioEncoding": "MP3"}
                },
                timeout=10.0
            )
            
            if response.status_code != 200:
                logger.error(f"Google TTS Error: {response.text}")
                raise HTTPException(status_code=response.status_code, detail="TTS Generation failed")
                
            data = response.json()
            return {"audioContent": data["audioContent"]} # Base64 encoded MP3
            
    except Exception as e:
        logger.error(f"TTS failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
