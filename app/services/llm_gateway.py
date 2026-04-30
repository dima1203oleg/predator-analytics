from __future__ import annotations

"""Predator Analytics v45.0 - LiteLLM Gateway Service
Unified interface for multi-LLM routing with automatic failover.
"""
import asyncio
from dataclasses import dataclass
from enum import StrEnum
import logging
import os
from typing import TYPE_CHECKING, Any

import litellm
from litellm import Router

if TYPE_CHECKING:
    from collections.abc import AsyncGenerator


logger = logging.getLogger("predator.llm_gateway")


class ModelTier(StrEnum):
    """Model tier for routing decisions."""

    PRIMARY = "primary"
    BACKUP = "backup"
    FAST = "fast"
    LOCAL = "local"


@dataclass
class LLMResponse:
    """Standardized LLM response."""

    content: str
    model: str
    tokens_used: int
    latency_ms: float
    cached: bool = False
    tier: ModelTier = ModelTier.PRIMARY


class LiteLLMGateway:
    """🛡️ LiteLLM Gateway для Predator Analytics.

    Features:
    - Multi-model failover (Claude → GPT-4 → Groq → Local)
    - Redis caching для швидкості та економії
    - Rate limiting та budget control
    - Automatic retry з exponential backoff
    - Latency-based routing
    """

    def __init__(self):
        self._router: Router | None = None
        self._initialized = False

        # Configure LiteLLM
        litellm.success_callback = ["langfuse"]  # Optional: for tracing
        litellm.failure_callback = ["langfuse"]
        litellm.set_verbose = False

    async def initialize(self):
        """Initialize the LLM router."""
        if self._initialized:
            return

        model_list = [
            # Primary: Claude 3.5 Sonnet
            {
                "model_name": "predator-main",
                "litellm_params": {
                    "model": "anthropic/claude-3-5-sonnet-20241022",
                    "api_key": os.getenv("ANTHROPIC_API_KEY"),
                },
                "model_info": {"tier": "primary"},
            },
            # Backup: GPT-4o
            {
                "model_name": "predator-main",
                "litellm_params": {
                    "model": "openai/gpt-4o",
                    "api_key": os.getenv("OPENAI_API_KEY"),
                },
                "model_info": {"tier": "backup"},
            },
            # Fast: Groq
            {
                "model_name": "predator-fast",
                "litellm_params": {
                    "model": "groq/llama-3.1-70b-versatile",
                    "api_key": os.getenv("GROQ_API_KEY"),
                },
                "model_info": {"tier": "fast"},
            },
        ]

        self._router = Router(
            model_list=model_list,
            routing_strategy="latency-based-routing",
            fallbacks=[{"predator-main": ["predator-fast"]}],
            set_verbose=False,
            num_retries=3,
            retry_after=5,
            allowed_fails=3,
            cooldown_time=60,
        )

        # Enable Redis caching if available
        redis_url = os.getenv("REDIS_URL", "redis://redis:6379")
        try:
            litellm.cache = litellm.Cache(
                type="redis", host=redis_url.split("://")[1].split(":")[0], port=6379, ttl=3600
            )
            logger.info("✅ LiteLLM Redis cache enabled")
        except Exception as e:
            logger.warning(f"⚠️ Redis cache unavailable: {e}")

        self._initialized = True
        logger.info("🚀 LiteLLM Gateway initialized with multi-model failover")

    async def complete(
        self,
        prompt: str,
        system_prompt: str | None = None,
        model: str = "predator-main",
        max_tokens: int = 2048,
        temperature: float = 0.7,
        stream: bool = False,
    ) -> LLMResponse:
        """Generate completion with automatic failover.

        Args:
            prompt: User prompt
            system_prompt: Optional system prompt
            model: Model name (predator-main, predator-fast)
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature
            stream: Whether to stream response

        Returns:
            LLMResponse with content and metadata

        """
        await self.initialize()

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        import time

        start_time = time.time()

        try:
            if stream:
                return await self._stream_complete(messages, model, max_tokens, temperature)

            response = await self._router.acompletion(
                model=model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
            )

            latency_ms = (time.time() - start_time) * 1000

            return LLMResponse(
                content=response.choices[0].message.content,
                model=response.model,
                tokens_used=response.usage.total_tokens,
                latency_ms=latency_ms,
                cached=getattr(response, "_hidden_params", {}).get("cache_hit", False),
            )

        except Exception as e:
            logger.exception(f"❌ LLM completion failed: {e}")
            # Return graceful fallback
            return LLMResponse(
                content=f"⚠️ AI тимчасово недоступний. Спробуйте пізніше. ({str(e)[:50]})",
                model="fallback",
                tokens_used=0,
                latency_ms=(time.time() - start_time) * 1000,
            )

    async def _stream_complete(
        self,
        messages: list[dict],
        model: str,
        max_tokens: int,
        temperature: float,
    ) -> AsyncGenerator[str, None]:
        """Stream completion tokens."""
        response = await self._router.acompletion(
            model=model,
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
            stream=True,
        )

        async for chunk in response:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content

    async def analyze(
        self,
        query: str,
        context: str | None = None,
        language: str = "uk",
    ) -> LLMResponse:
        """Analyze query with Predator AI.

        Specialized method for analytical queries
        """
        system_prompt = f"""Ви — PREDATOR AI, експертна аналітична система.

Мова відповіді: {"Українська" if language == "uk" else "English"}

Ваші принципи:
1. Точність: Базуйтесь на фактах, уникайте припущень
2. Структура: Організовуйте відповідь логічно
3. Дієвість: Надавайте конкретні рекомендації
4. Критичність: Виявляйте аномалії та ризики

Контекст даних: {context or "Загальний аналіз"}
"""

        return await self.complete(
            prompt=query,
            system_prompt=system_prompt,
            model="predator-main",
            max_tokens=4096,
            temperature=0.5,  # Lower for analytical tasks
        )

    async def council_debate(
        self,
        query: str,
        models: list[str] | None = None,
    ) -> dict[str, Any]:
        """Multi-model council debate.

        Queries multiple models and synthesizes consensus
        """
        models = models or ["predator-main", "predator-fast"]

        async def get_opinion(model: str) -> dict:
            response = await self.complete(
                prompt=query,
                model=model,
                temperature=0.8,  # Higher for diverse opinions
            )
            return {
                "model": model,
                "response": response.content,
                "latency_ms": response.latency_ms,
            }

        # Parallel queries
        opinions = await asyncio.gather(*[get_opinion(m) for m in models])

        # Synthesize consensus
        synthesis_prompt = f"""Проаналізуйте ці відповіді та синтезуйте найкращу:

{chr(10).join([f"[{o['model']}]: {o['response'][:500]}" for o in opinions])}

Надайте консенсусну відповідь, враховуючи всі точки зору."""

        consensus = await self.complete(
            prompt=synthesis_prompt,
            model="predator-main",
            temperature=0.3,
        )

        return {
            "opinions": opinions,
            "consensus": consensus.content,
            "models_used": models,
        }

    def get_status(self) -> dict[str, Any]:
        """Get gateway status."""
        return {
            "initialized": self._initialized,
            "models_available": [
                "predator-main (Claude 3.5 → GPT-4o fallback)",
                "predator-fast (Groq LLaMA)",
            ],
            "cache_enabled": litellm.cache is not None,
            "routing_strategy": "latency-based-routing",
        }


# Singleton instance
_gateway: LiteLLMGateway | None = None


def get_llm_gateway() -> LiteLLMGateway:
    """Get or create LLM Gateway singleton."""
    global _gateway
    if _gateway is None:
        _gateway = LiteLLMGateway()
    return _gateway
