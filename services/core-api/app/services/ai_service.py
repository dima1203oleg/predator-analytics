"""
AI Service — PREDATOR Analytics v55.1 Ironclad.

LiteLLM wrapper for Copilot, RAG, and automated insights.
"""
import httpx
from typing import Optional, Dict, Any, List
from app.config import get_settings

settings = get_settings()

class AIService:
    @staticmethod
    async def chat_completion(
        messages: List[Dict[str, str]], 
        model: Optional[str] = None
    ) -> str:
        """Виклик LiteLLM для отримання відповіді."""
        target_model = model or settings.OLLAMA_MODEL
        
        async with httpx.AsyncClient() as client:
             response = await client.post(
                f"{settings.LITELLM_API_BASE}/chat/completions",
                json={
                    "model": target_model,
                    "messages": messages,
                    "temperature": 0.2
                },
                timeout=60.0
            )
             
             if response.status_code == 200:
                 result = response.json()
                 return result["choices"][0]["message"]["content"]
             return f"AI Error: {response.status_code} - {response.text}"

    @staticmethod
    async def get_embeddings(text: str) -> List[float]:
        """Отримання векторних ембедінгів для тексту."""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.LITELLM_API_BASE}/embeddings",
                json={
                    "model": "text-embedding-3-small",
                    "input": text
                }
            )
            if response.status_code == 200:
                result = response.json()
                return result["data"][0]["embedding"]
            return [0.0] * 1536
