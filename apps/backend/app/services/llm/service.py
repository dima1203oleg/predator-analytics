"""
LLM Service Facade
Manages providers, routing, and fallbacks.
"""
import logging
from typing import Optional, Dict, Any, List
from ...core.config import settings
from ...services.llm_keys import get_key_manager
from .providers.base import LLMResponse, BaseLLMProvider
from .providers.groq import GroqProvider
# Add other providers here

logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self):
        self.key_manager = get_key_manager()
        self.providers: Dict[str, BaseLLMProvider] = {}

    async def generate(self,
                      prompt: str,
                      system: str = "",
                      provider: str = "groq",
                      **kwargs) -> LLMResponse:
        """
        Generate text using specified provider with fallback support
        """
        # 1. Try primary provider
        response = await self._try_generate(provider, prompt, system, **kwargs)
        if response.success:
            return response

        logger.warning(f"Primary provider {provider} failed: {response.error}")

        # 2. Try fallbacks from config
        fallbacks = settings.LLM_FALLBACK_CHAIN.split(",")
        for fb_provider in fallbacks:
            if fb_provider == provider:
                continue

            logger.info(f"Trying fallback: {fb_provider}")
            response = await self._try_generate(fb_provider, prompt, system, **kwargs)
            if response.success:
                return response

        return LLMResponse(
            success=False,
            content="",
            provider="all",
            model="none",
            error="All providers failed"
        )

    async def _try_generate(self, provider_name: str, prompt: str, system: str, **kwargs) -> LLMResponse:
        """Helper to get key and run generation"""
        key = self.key_manager.get_key(provider_name)
        if not key:
            return LLMResponse(False, "", provider_name, "unknown", error="No available keys")

        # Instantiate provider on the fly (or cache it)
        # In a real app, we might cache provider instances
        provider = self._get_provider_instance(provider_name, key)
        if not provider:
             return LLMResponse(False, "", provider_name, "unknown", error="Provider implementation not found")

        response = await provider.generate(prompt, system, **kwargs)

        if response.success:
            self.key_manager.mark_success(provider_name, key)
        else:
            self.key_manager.mark_failure(provider_name, key)

        return response

    def _get_provider_instance(self, name: str, key: str) -> Optional[BaseLLMProvider]:
        """Factory for providers"""
        if name == "groq":
            return GroqProvider(key)
        # Add others: gemini, mistral, etc.
        return None

# Global instance
llm_service = LLMService()
