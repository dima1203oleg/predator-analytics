"""AI Service — PREDATOR Analytics v55.1 Ironclad.

LiteLLM wrapper for Copilot, RAG, and automated insights.
"""
from typing import Any

import httpx

from app.config import get_settings

settings = get_settings()

class AIService:
    @staticmethod
    async def chat_completion(
        messages: list[dict[str, str]],
        model: str | None = None
    ) -> str:
        """Виклик LiteLLM для отримання відповіді."""
        try:
            async with httpx.AsyncClient() as client:
                 target_model = model or settings.OLLAMA_MODEL
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

                 error_msg = f"AI Error: {response.status_code} - {response.text}"
                 return error_msg
        except Exception as e:
            error_msg = f"AI Exception: {e!s}"
            return error_msg
        return "AI Error: Unexpected path"

    @staticmethod
    async def generate_insight(prompt: str, context: dict[str, Any] | None = None) -> str:
        """Виклик Sovereign Advisor через MCP Router (v55.2).
        Використовується для складної аналітики та інтерпретації ризиків.
        """
        mcp_url = settings.MCP_ROUTER_URL or "http://mcp-router:8080/v1/query"

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    mcp_url,
                    json={
                        "prompt": prompt,
                        "task_type": "reasoning",
                        "context": context
                    },
                    timeout=90.0
                )
                if response.status_code == 200:
                    result = response.json()
                    return result.get("content", "Помилка: Пуста відповідь від Advisor")

                error_msg = f"Advisor Unreachable: {response.status_code}"
                return error_msg
            except Exception as e:
                error_msg = f"Advisor Exception: {e!s}"
                return error_msg

        return "Advisor Error: Unexpected path"

    @staticmethod
    async def get_embeddings(text: str) -> list[float]:
        """Отримання векторних ембедінгів для тексту."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{settings.LITELLM_API_BASE}/embeddings",
                    json={
                        "model": f"ollama/{settings.OLLAMA_EMBEDDING_MODEL}",
                        "input": text
                    },
                    timeout=20.0
                )
                if response.status_code == 200:
                    result = response.json()
                    return result["data"][0]["embedding"]

                return [0.0] * 1536
        except Exception:
            return [0.0] * 1536

        return [0.0] * 1536
