"""Module: cache
Component: mcp-router
Predator Analytics v45.1.
"""

import hashlib
import json
import logging
import os
from typing import Any

import redis.asyncio as redis


logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://predator-analytics-redis:6379")


class LLMCache:
    """Redis-based caching for LLM responses.
    Reduces latency, token usage, and provides deterministic replay for audit.
    Section 3.2.1 of Spec.
    """

    def __init__(self, ttl_seconds: int = 3600):
        self.redis = redis.from_url(REDIS_URL, decode_responses=True)
        self.ttl = ttl_seconds

    def _generate_key(self, prompt: str, context: dict | None, model: str) -> str:
        """Deterministic key generation."""
        context_str = json.dumps(context, sort_keys=True, default=str) if context else "{}"
        payload = f"{model}:{prompt}:{context_str}"
        return f"llm_cache:{hashlib.sha256(payload.encode()).hexdigest()}"

    async def get_cached(
        self, prompt: str, context: dict | None, model: str
    ) -> dict[str, Any] | None:
        try:
            key = self._generate_key(prompt, context, model)
            cached = await self.redis.get(key)
            if cached:
                logger.debug("LLM cache HIT", extra={"cache_key": key})
                return json.loads(cached)
            return None
        except Exception as e:
            logger.warning(f"Cache get failed: {e}")
            return None

    async def set_cached(
        self, prompt: str, context: dict | None, model: str, response: dict[str, Any]
    ) -> None:
        try:
            key = self._generate_key(prompt, context, model)
            await self.redis.setex(key, self.ttl, json.dumps(response))
            logger.debug("LLM cache SET", extra={"cache_key": key})
        except Exception as e:
            logger.warning(f"Cache set failed: {e}")

    async def close(self):
        await self.redis.close()
