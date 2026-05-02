"""AI Service Client for Ingestion Worker.

Дозволяє воркерам викликати AI-функціонал через Core API.
"""
import httpx
from app.config import get_settings
from predator_common.logging import get_logger

logger = get_logger("ingestion_worker.ai_client")
settings = get_settings()

class AIServiceClient:
    def __init__(self):
        # В реальному середовищі ми викликаємо внутрішній URL core-api
        self.base_url = "http://core-api:8000/api/v1/omniverse" 

    async def generate_insight(self, prompt: str) -> str:
        """Виклик AI через внутрішній проксі (імітація)."""
        # У спрощеній версії ми можемо викликати LiteLLM напряму,
        # якщо воркер має доступ до ключів. 
        # Тут ми зробимо заглушку або виклик LiteLLM якщо конфіг дозволяє.
        
        try:
            # Спроба прямого виклику LiteLLM для швидкості воркера
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{settings.LITELLM_API_BASE}/chat/completions",
                    json={
                        "model": settings.OLLAMA_MODEL,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.1
                    },
                    timeout=60.0
                )
                if response.status_code == 200:
                    return response.json()["choices"][0]["message"]["content"]
                return f"Error: {response.status_code}"
        except Exception as e:
            logger.error(f"AI Client error: {e}")
            return "{'risk_score': 0, 'reason': 'AI Unavailable'}"
