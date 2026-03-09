"""
Copilot Router — PREDATOR Analytics v55.1 Ironclad.

AI-assistant for analyzing customs data and risk reports.
"""
from typing import List, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.services.ai_service import AIService
from app.dependencies import get_current_active_user

router = APIRouter(prefix="/copilot", tags=["ai"])

class ChatRequest(BaseModel):
    message: str
    context_ueid: Optional[str] = None
    history: List[Dict[str, str]] = []

@router.post("/chat")
async def copilot_chat(
    payload: ChatRequest,
    user: Dict = Depends(get_current_active_user)
):
    """Інтерактивний AI-асистент."""
    system_prompt = {
        "role": "system",
        "content": "Ти - PREDATOR Copilot, елітний аналітик митних даних України. Твоя ціль - допомагати знаходити корупційні схеми та аномалії."
    }
    
    messages = [system_prompt] + payload.history + [{"role": "user", "content": payload.message}]
    
    response_text = await AIService.chat_completion(messages)
    return {"reply": response_text}
