import httpx
import logging
from typing import Optional

logger = logging.getLogger("predator.orchestrator.reasoning")

class DeepSeekReasoner:
    def __init__(self, ollama_url: str = "http://localhost:11434"):
        self.ollama_url = ollama_url
        self.model = "deepseek-r1"

    async def analyze_failures(self, failures: list[str]) -> Optional[str]:
        """Використовує DeepSeek-R1 для аналізу першопричини помилок та формування плану вирішення"""
        if not failures:
            return None

        prompt = (
            "Ви є автономним архітектором системи PREDATOR Analytics v61.0-ELITE.\n"
            "Під час діагностики UTOS виявлено наступні помилки:\n\n"
        )
        for f in failures:
            prompt += f"- {f}\n"

        prompt += (
            "\nПроаналізуйте ці помилки та запропонуйте план рефакторингу для агента Claw Code.\n"
            "Зосередьтеся на першопричинах (Root Cause) та запропонуйте конкретні модифікації."
        )

        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    f"{self.ollama_url}/api/generate",
                    json={
                        "model": self.model,
                        "prompt": prompt,
                        "stream": False
                    },
                    timeout=300.0
                )
                if resp.status_code == 200:
                    data = resp.json()
                    return data.get("response", "Не вдалося отримати відповідь від моделі.")
                else:
                    logger.warning(f"Ollama inference failed: {resp.status_code}")
                    return None
        except Exception as e:
            logger.error(f"Error connecting to Ollama DeepSeek-R1: {e}")
            return None
