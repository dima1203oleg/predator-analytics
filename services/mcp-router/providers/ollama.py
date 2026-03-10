"""Module: ollama_provider
Component: mcp-router
Predator Analytics v45.1.
"""

import logging
from typing import Any

import httpx

from .base import LLMProvider


logger = logging.getLogger(__name__)


class OllamaProvider(LLMProvider):
    """Local LLM Provider via Ollama.
    Base URL: http://predator-analytics-ollama:11434 (internal K8s DNS).
    """

    def __init__(self, base_url: str = "http://predator-analytics-ollama:11434"):
        self.base_url = base_url

    async def generate_response(
        self,
        prompt: str,
        model: str,
        context: dict[str, Any] | None = None,
        max_tokens: int = 1024,
        temperature: float = 0.7,
    ) -> dict[str, Any]:

        url = f"{self.base_url}/api/generate"

        # Prepare Ollama-specific payload
        payload = {
            "model": model,
            "prompt": prompt,
            "stream": False,
            "options": {"num_predict": max_tokens, "temperature": temperature},
        }

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                data = response.json()

                return {
                    "content": data.get("response", ""),
                    "prompt_eval_count": data.get("prompt_eval_count", 0),
                    "eval_count": data.get("eval_count", 0),
                    "model": model,
                    "provider": "ollama",
                    "latency_ms": data.get("total_duration", 0) / 1_000_000,  # ns to ms
                }

        except httpx.HTTPError as e:
            logger.exception(f"Ollama generation failed: {e!s}", extra={"model": model})
            raise

    async def health_check(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(f"{self.base_url}/api/tags")
                return resp.status_code == 200
        except Exception:
            return False
