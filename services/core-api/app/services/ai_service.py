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
        route: LLMRoute = LLMRoute.HYBRID,
    ) -> str:
        """Виклик LiteLLM або Gemini для отримання відповіді з Circuit Breaker."""
        # CLOUD routing через Gemini SDK
        if route == LLMRoute.CLOUD:
            prompt = "\n".join([f"{m['role']}: {m['content']}" for m in messages])
            result = await gemini_service.generate(prompt)
            return result["content"]

        target_model = model or settings.OLLAMA_MODEL

        if not _llm_breaker.allow_request():
            logger.warning("LLM Circuit Breaker OPEN — запит відхилено")
            return "AI Сервіс тимчасово недоступний. Спробуйте пізніше."

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{settings.LITELLM_API_BASE}/chat/completions",
                    json={
                        "model": target_model,
                        "messages": messages,
                        "temperature": temperature,
                        "max_tokens": max_tokens,
                    },
                    timeout=60.0,
                )

                if response.status_code == 200:
                    result = response.json()
                    _llm_breaker.record_success()
                    return result["choices"][0]["message"]["content"]

                _llm_breaker.record_failure()
                return f"AI Error: {response.status_code} - {response.text[:200]}"
        except Exception as e:
            _llm_breaker.record_failure()
            logger.error(f"AI Exception: {e!s}")
            return f"AI Exception: {e!s}"

    @staticmethod
    async def chat_completion_stream(
        messages: list[dict[str, str]],
        model: str | None = None,
        temperature: float = 0.2,
    ) -> AsyncIterator[str]:
        """Streaming відповідь для AI Copilot."""
        target_model = model or settings.OLLAMA_MODEL

        if not _llm_breaker.allow_request():
            yield "AI Сервіс тимчасово недоступний."
            return

        try:
            async with httpx.AsyncClient() as client, client.stream(
                "POST",
                f"{settings.LITELLM_API_BASE}/chat/completions",
                json={
                    "model": target_model,
                    "messages": messages,
                    "temperature": temperature,
                    "stream": True,
                },
                timeout=90.0,
            ) as response:
                if response.status_code != 200:
                    _llm_breaker.record_failure()
                    yield f"AI Error: {response.status_code}"
                    return

                _llm_breaker.record_success()
                async for line in response.aiter_lines():
                    if line.startswith("data: ") and line != "data: [DONE]":
                        import orjson
                        try:
                            chunk = orjson.loads(line[6:])
                            delta = chunk["choices"][0].get("delta", {})
                            if content := delta.get("content"):
                                yield content
                        except (orjson.JSONDecodeError, KeyError, IndexError):
                            continue
        except Exception as e:
            _llm_breaker.record_failure()
            logger.error(f"Streaming exception: {e!s}")
            yield f"AI Streaming Error: {e!s}"

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
        """Отримання векторних ембедінгів для тексту (пріоритет: Gemini 004)."""
        fallback_dim = 768

        if not _embedding_breaker.allow_request():
            return [0.0] * fallback_dim

        # 1. Пріоритет — Gemini Enterprise (768-dim)
        try:
            vector = await gemini_service.embed(text)
            if any(vector):  # Якщо не нульовий
                _embedding_breaker.record_success()
                return vector
        except Exception as e:
            logger.warning(f"Gemini embedding failed, falling back to LiteLLM: {e}")

        # 2. Fallback — LiteLLM / Ollama
        embed_model = model or f"ollama/{settings.OLLAMA_EMBEDDING_MODEL}"
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{settings.LITELLM_API_BASE}/embeddings",
                    json={"model": embed_model, "input": text},
                    timeout=20.0,
                )
                if response.status_code == 200:
                    result = response.json()
                    _embedding_breaker.record_success()
                    return result["data"][0]["embedding"]

                _embedding_breaker.record_failure()
                return [0.0] * fallback_dim
        except Exception as e:
            _embedding_breaker.record_failure()
            logger.warning(f"Embedding fallback error: {e!s}")
            return [0.0] * fallback_dim
