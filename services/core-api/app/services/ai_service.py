"""AI Service — PREDATOR Analytics v61.0-ELITE.

LiteLLM MCP Router з підтримкою:
- Tri-State Routing: SOVEREIGN (Local) → HYBRID → CLOUD
- Circuit Breaker для стійкості
- Streaming для AI Copilot
- VRAM Guard (8GB limit)
"""
from collections.abc import AsyncIterator
from enum import StrEnum
from typing import Any

import httpx

from app.config import get_settings
from app.services.gemini_agent_service import gemini_service
from app.services.vram_watchdog import vram_sentinel
from predator_common.circuit_breaker import CircuitBreaker
from predator_common.logging import get_logger

logger = get_logger("ai_service")
settings = get_settings()

# Circuit breakers для кожного AI-бекенду
_llm_breaker = CircuitBreaker(name="llm_litellm", failure_threshold=3, reset_timeout_s=60)
_mcp_breaker = CircuitBreaker(name="mcp_router", failure_threshold=3, reset_timeout_s=120)
_embedding_breaker = CircuitBreaker(name="embedding", failure_threshold=5, reset_timeout_s=30)


class LLMRoute(StrEnum):
    """Tri-State маршрутизація LLM запитів."""

    SOVEREIGN = "sovereign"  # 100% Local (Nemotron, Qwen3)
    HYBRID = "hybrid"        # Groq/Gemini Flash + Local
    CLOUD = "cloud"          # Gemini Pro, GLM-5.1, Azure


class AIService:
    """Уніфікований AI Service з LiteLLM MCP Router."""

    @staticmethod
    async def chat_completion(
        messages: list[dict[str, str]],
        model: str | None = None,
        temperature: float = 0.2,
        max_tokens: int = 4096,
        route: LLMRoute = LLMRoute.SOVEREIGN,
        include_reasoning: bool = False,
    ) -> str:
        """Прямий виклик локальної моделі Ollama."""
        target_model = model or settings.OLLAMA_MODEL

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{settings.OLLAMA_API_URL}/api/chat",
                    json={
                        "model": target_model,
                        "messages": messages,
                        "stream": False,
                        "options": {"temperature": temperature}
                    },
                    timeout=120.0,
                )

                if response.status_code == 200:
                    result = response.json()
                    return result.get("message", {}).get("content", "")
                
                return f"Ollama Error: {response.status_code} - {response.text[:200]}"
        except Exception as e:
            logger.error(f"Ollama Exception: {e!s}")
            return f"Ollama Exception: {e!s}"

    async def chat_completion_stream(
        messages: list[dict[str, str]],
        model: str | None = None,
        temperature: float = 0.2,
    ) -> AsyncIterator[str]:
        """Streaming відповідь напряму через Ollama."""
        target_model = model or settings.OLLAMA_MODEL
        try:
            async with httpx.AsyncClient() as client, client.stream(
                "POST",
                f"{settings.OLLAMA_API_URL}/api/chat",
                json={
                    "model": target_model,
                    "messages": messages,
                    "options": {"temperature": temperature},
                },
                timeout=120.0,
            ) as response:
                if response.status_code != 200:
                    yield f"Ollama Error: {response.status_code}"
                    return

                async for line in response.aiter_lines():
                    if not line.strip():
                        continue
                    import json
                    try:
                        chunk = json.loads(line)
                        if "message" in chunk and "content" in chunk["message"]:
                            yield chunk["message"]["content"]
                    except json.JSONDecodeError:
                        pass
        except Exception as e:
            logger.error(f"Streaming exception: {e!s}")
            yield f"Ollama Streaming Error: {e!s}"

    @staticmethod
    async def get_reasoning(
        prompt: str,
        context: dict[str, Any] | None = None,
    ) -> str:
        """Виклик Reasoning Model для глибокого аналізу."""
        messages = [{"role": "user", "content": prompt}]
        if context:
            messages.insert(0, {"role": "system", "content": f"Context: {context}"})

        return await AIService.chat_completion(
            messages,
            model=settings.LITELLM_REASONING_MODEL,
        )

    @staticmethod
    async def generate_insight(
        prompt: str,
        context: dict[str, Any] | None = None,
    ) -> str:
        """Виклик Sovereign Advisor через MCP Router.

        Використовується для складної аналітики та інтерпретації ризиків.
        """
        mcp_url = settings.MCP_ROUTER_URL or "http://mcp-router:8080/v1/query"

        if not _mcp_breaker.allow_request():
            logger.warning("MCP Router Circuit Breaker OPEN — fallback на пряме LLM")
            return await AIService.chat_completion(
                [{"role": "user", "content": prompt}],
                model=settings.LITELLM_ELITE_MODEL,
            )

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    mcp_url,
                    json={
                        "prompt": prompt,
                        "task_type": "reasoning",
                        "context": context,
                    },
                    timeout=90.0,
                )
                if response.status_code == 200:
                    result = response.json()
                    _mcp_breaker.record_success()
                    return result.get("content", "Помилка: Пуста відповідь від Advisor")

                _mcp_breaker.record_failure()
                return f"Advisor Unreachable: {response.status_code}"
        except Exception as e:
            _mcp_breaker.record_failure()
            logger.error(f"Advisor Exception: {e!s}")
            return f"Advisor Exception: {e!s}"

    @staticmethod
    async def get_embeddings(text: str, model: str | None = None) -> list[float]:
        """Отримання векторних ембедінгів для тексту через локальний sentence-transformers."""
        fallback_dim = 768

        if not _embedding_breaker.allow_request():
            return [0.0] * fallback_dim

        try:
            from sentence_transformers import SentenceTransformer
            
            # Use the same model as ingestion worker for exact vector match (768-dim)
            embedder = SentenceTransformer("sentence-transformers/all-mpnet-base-v2", device="cpu")
            embedding = embedder.encode(text).tolist()
            
            _embedding_breaker.record_success()
            return embedding
        except Exception as e:
            _embedding_breaker.record_failure()
            logger.warning(f"Local embedding error: {e!s}")
            return [0.0] * fallback_dim
