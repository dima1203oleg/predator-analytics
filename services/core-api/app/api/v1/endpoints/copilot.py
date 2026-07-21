from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any
import asyncio
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

class CopilotMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[CopilotMessage]
    dossier: Dict[str, Any] = None

@router.post("/chat", summary="AI Copilot Chat Endpoint")
async def chat_with_copilot(req: ChatRequest):
    """
    Ендпоінт для спілкування з AI Copilot по контексту досьє.
    Поки що симулює виклик до LiteLLM.
    """
    logger.info(f"Отримано запит до Copilot. К-сть повідомлень: {len(req.messages)}")
    
    # Симулюємо затримку "роздумів" LLM
    await asyncio.sleep(2)
    
    # Визначаємо суть останнього повідомлення
    last_msg = req.messages[-1].content.lower()
    
    response_text = "Я проаналізував дані. "
    
    if "ризик" in last_msg or "risk" in last_msg:
        response_text += "Знайдено підвищений ризик через наявність санкцій та зв'язків з високоризиковими крипто-гаманцями."
    elif "актив" in last_msg or "asset" in last_msg:
        response_text += "Особа володіє компаніями та нерухомістю. Можлива наявність прихованих активів через офшорні юрисдикції."
    elif "санкц" in last_msg:
        response_text += "Так, особа або пов'язані з нею компанії фігурують у санкційних списках (РНБО)."
    elif "досьє" in last_msg:
        # Initial briefing scenario
        response_text += "Профіль містить дані з ЄДР, соцмереж, витоків, крипто-транзакцій та декларацій. Загальний ризик-бал вище середнього."
    else:
        response_text += "Як я можу ще допомогти вам з цим розслідуванням?"
        
    return {
        "answer": response_text,
        "thought_process": [
            "Збір контексту з графа Neo4j...",
            "Оцінка ризиків та семантичний аналіз...",
            "Генерація відповіді..."
        ]
    }
