"""Module: gemini_provider
Component: mcp-router
Predator Analytics v45.1.
"""

import json
import logging
import os
import time
from typing import Any

import httpx

from .base import LLMProvider

logger = logging.getLogger(__name__)


class GeminiProvider(LLMProvider):
    """LLM Provider via Google Gemini (REST API).
    Used as high-capacity fallback.
    """

    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        # Base URL for Gemini 2.0 Flash or 1.5 Flash
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models"

    async def generate_response(
        self,
        prompt: str,
        model: str,
        context: dict[str, Any] | None = None,
        max_tokens: int = 1024,
        temperature: float = 0.7,
    ) -> dict[str, Any]:

        if not self.api_key:
            raise ValueError("Gemini API key is missing")

        url = f"{self.base_url}/{model}:generateContent?key={self.api_key}"

        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens,
            },
        }

        # Handle simplified context if provided
        if context:
            # Prepend context to prompt for simplicity in REST call
            context_str = json.dumps(context, indent=2)
            payload["contents"][0]["parts"][0]["text"] = (
                f"Context:\n{context_str}\n\nTask:\n{prompt}"
            )

        try:
            start_time = time.time()
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                data = response.json()

                latency = (time.time() - start_time) * 1000

                # Extract first candidate's content
                candidates = data.get("candidates", [])
                if not candidates:
                    raise Exception("Gemini returned no candidates")

                parts = candidates[0].get("content", {}).get("parts", [])
                content = "".join([p.get("text", "") for p in parts])

                return {
                    "content": content,
                    "prompt_eval_count": 0,  # Gemini REST doesn't always expose this simply
                    "eval_count": 0,
                    "model": model,
                    "provider": "gemini",
                    "latency_ms": latency,
                }

        except httpx.HTTPError as e:
            logger.exception(f"Gemini generation failed: {e!s}", extra={"model": model})
            raise

    async def health_check(self) -> bool:
        return bool(self.api_key)
