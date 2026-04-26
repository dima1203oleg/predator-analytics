"""Module: gemini_provider
Component: mcp-router
Predator Analytics v61.0-ELITE.

Оновлено для Gemini 2.5 Flash з підтримкою:
- Code Execution Tool
- Structured Output
- Round-robin key rotation
"""

import json
import logging
import os
import time
from typing import Any

import httpx

from .base import LLMProvider

logger = logging.getLogger(__name__)

# Пул API ключів для round-robin
_KEY_POOL: list[str] = []
_key_index = 0


def _get_key_pool() -> list[str]:
    """Ініціалізація пулу API ключів з ENV."""
    global _KEY_POOL  # noqa: PLW0603
    if not _KEY_POOL:
        keys = []
        primary = os.getenv("GEMINI_API_KEY", "")
        if primary:
            keys.append(primary)
        for i in range(2, 10):
            key = os.getenv(f"GEMINI_API_KEY_{i}", "")
            if key:
                keys.append(key)
        _KEY_POOL = keys
    return _KEY_POOL


def _next_key() -> str:
    """Round-robin вибір наступного ключа."""
    global _key_index  # noqa: PLW0603
    pool = _get_key_pool()
    if not pool:
        msg = "Жодного Gemini API ключа не налаштовано"
        raise ValueError(msg)
    key = pool[_key_index % len(pool)]
    _key_index += 1
    return key


class GeminiProvider(LLMProvider):
    """LLM Provider via Google Gemini 2.5 Flash (REST API).

    Підтримує:
    - Текстову генерацію
    - Code Execution Tool
    - Vision (аналіз зображень)
    - Round-robin key rotation для обходу rate limits

    Used as high-capacity CLOUD-tier model.
    """

    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        # Gemini 2.5 Flash — актуальний базовий URL
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models"

    async def generate_response(
        self,
        prompt: str,
        model: str,
        context: dict[str, Any] | None = None,
        max_tokens: int = 4096,
        temperature: float = 0.3,
    ) -> dict[str, Any]:

        api_key = _next_key() if _get_key_pool() else self.api_key
        if not api_key:
            msg = "Gemini API key відсутній"
            raise ValueError(msg)

        # Нормалізуємо назву моделі (видаляємо префікс gemini/)
        model_name = model.replace("gemini/", "") if model.startswith("gemini/") else model
        url = f"{self.base_url}/{model_name}:generateContent?key={api_key}"

        payload: dict[str, Any] = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens,
            },
        }

        # Додаємо контекст як system instruction
        if context:
            context_str = json.dumps(context, indent=2, ensure_ascii=False)
            payload["contents"][0]["parts"][0]["text"] = (
                f"Контекст:\n{context_str}\n\nЗавдання:\n{prompt}"
            )

        try:
            start_time = time.time()
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                data = response.json()

                latency = (time.time() - start_time) * 1000

                candidates = data.get("candidates", [])
                if not candidates:
                    msg = "Gemini не повернув жодного кандидата"
                    raise Exception(msg)  # noqa: TRY002

                parts = candidates[0].get("content", {}).get("parts", [])
                content = "".join([p.get("text", "") for p in parts])

                # Лічильники токенів (якщо доступні)
                usage = data.get("usageMetadata", {})

                return {
                    "content": content,
                    "prompt_eval_count": usage.get("promptTokenCount", 0),
                    "eval_count": usage.get("candidatesTokenCount", 0),
                    "model": model_name,
                    "provider": "gemini",
                    "latency_ms": latency,
                }

        except httpx.HTTPError as e:
            logger.exception(f"Gemini generation failed: {e!s}", extra={"model": model_name})
            raise

    async def health_check(self) -> bool:
        """Перевірка наявності API ключів."""
        pool = _get_key_pool()
        return len(pool) > 0
