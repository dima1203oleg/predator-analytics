
"""
Module: base_provider
Component: mcp-router
Predator Analytics v25.1
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

class LLMProvider(ABC):
    """
    Abstract Base Class for all LLM Providers.
    Enforces standardized interface for Ollama, Groq, Gemini.
    """
    
    @abstractmethod
    async def generate_response(
        self,
        prompt: str,
        model: str,
        context: Optional[Dict[str, Any]] = None,
        max_tokens: int = 1024,
        temperature: float = 0.7
    ) -> Dict[str, Any]:
        """
        Standard generation method.
        Must return dict with keys:
        - content: str
        - prompt_eval_count: int
        - eval_count: int
        - model: str
        - provider: str
        """
        pass

    @abstractmethod
    async def health_check(self) -> bool:
        """Returns True if provider is reachable."""
        pass
