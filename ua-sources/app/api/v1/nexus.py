
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from app.agents.orchestrator.supervisor import NexusSupervisor, get_nexus_supervisor
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
