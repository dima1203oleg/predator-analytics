"""Module: groq_provider
Component: mcp-router
Predator Analytics v45.1.
"""

import logging
import os
from typing import Any

import httpx

from .base import LLMProvider

logger = logging.getLogger(__name__)


class GroqProvider(LLMProvider):
    """High-speed LLM Provider via Groq Cloud.
    Requires GEMINI_API_KEY (Wait, the user said Groq free too).
    Actually, usually GROQ_API_KEY is needed.
    The spec says $0 budget. Groq has a free tier.
    """

    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or os.getenv("GROQ_API_KEY")
        self.base_url = "https://api.groq.com/openai/v1/chat/completions"

    async def generate_response(
        self,
        prompt: str,
        model: str,
        context: dict[str, Any] | None = None,
        max_tokens: int = 1024,
        temperature: float = 0.7,
    ) -> dict[str, Any]:

        if not self.api_key:
            raise ValueError("Groq API key is missing")

        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}

        # Groq uses OpenAI-like Chat Completion
        payload = {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": max_tokens,
            "temperature": temperature,
            "stream": False,
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(self.base_url, json=payload, headers=headers)
                response.raise_for_status()
                data = response.json()

                choice = data["choices"][0]["message"]
                usage = data.get("usage", {})

                return {
                    "content": choice.get("content", ""),
                    "prompt_eval_count": usage.get("prompt_tokens", 0),
                    "eval_count": usage.get("completion_tokens", 0),
                    "model": model,
                    "provider": "groq",
                    "latency_ms": data.get("x_groq", {}).get("usage", {}).get("total_time", 0)
                    * 1000
                    or 0,
                }

        except httpx.HTTPError as e:
            logger.exception(f"Groq generation failed: {e!s}", extra={"model": model})
            raise

    async def health_check(self) -> bool:
        if not self.api_key:
            return False
        return True  # Simplified for now
