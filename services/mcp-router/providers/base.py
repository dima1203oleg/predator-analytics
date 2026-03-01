"""Module: base_provider
Component: mcp-router
Predator Analytics v45.1.
"""

from abc import ABC, abstractmethod
from typing import Any


class LLMProvider(ABC):
    """Abstract Base Class for all LLM Providers.
    Enforces standardized interface for Ollama, Groq, Gemini.
    """

    @abstractmethod
    async def generate_response(
        self,
        prompt: str,
        model: str,
        context: dict[str, Any] | None = None,
        max_tokens: int = 1024,
        temperature: float = 0.7,
    ) -> dict[str, Any]:
        """Standard generation method.
        Must return dict with keys:
        - content: str
        - prompt_eval_count: int
        - eval_count: int
        - model: str
        - provider: str.
        """

    @abstractmethod
    async def health_check(self) -> bool:
        """Returns True if provider is reachable."""
