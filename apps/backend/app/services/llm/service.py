"""
LLM Service Facade
Manages providers, routing, and fallbacks.
"""
import logging
import os
from typing import Optional, Dict, Any, List
from ...core.config import settings
from ...services.llm_keys import get_key_manager
from ...core.resilience import get_circuit_breaker, CircuitBreakerOpenException
from .providers.base import LLMResponse, BaseLLMProvider

# Providers
from .providers.groq import GroqProvider
from .providers.gemini import GeminiProvider
from .providers.mistral import MistralProvider
from .providers.openai import OpenAIProvider
from .providers.ollama import OllamaProvider

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
        # Resolve default provider if needed
        if provider == "auto":
            provider = settings.LLM_DEFAULT_PROVIDER

        # 1. Try primary provider
        response = await self._try_generate(provider, prompt, system, **kwargs)
        if response.success:
            return response

        logger.warning(f"Primary provider {provider} failed: {response.error}")

        # 2. Try fallbacks from config
        fallbacks = settings.LLM_FALLBACK_CHAIN.split(",")
        for fb_provider in fallbacks:
            fb_provider = fb_provider.strip()
            if fb_provider == provider or not fb_provider:
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

        # Special case for Ollama (key is base_url)
        if provider_name == "ollama" and not key:
             key = settings.OLLAMA_BASE_URL

        if not key:
            return LLMResponse(False, "", provider_name, "unknown", error="No available keys")

        # Instantiate provider on the fly
        provider = self._get_provider_instance(provider_name, key)
        if not provider:
             return LLMResponse(False, "", provider_name, "none", error="Provider implementation not found")

        try:
            # Wrap in Circuit Breaker
            cb = get_circuit_breaker(f"llm_{provider_name}")
            response = await cb.call(provider.generate, prompt, system, **kwargs)

            if response.success:
                if provider_name != "ollama":
                    self.key_manager.mark_success(provider_name, key)
            else:
                if provider_name != "ollama":
                    self.key_manager.mark_failure(provider_name, key)
                    # Note: We don't trigger CB failure here for logical errors,
                    # only for exceptions caught by CB wrapper.
                    # If provider.generate() returns success=False but no raise, CB thinks it's OK.
                    # We might want to raise if we want CB to open on API errors.
                    # For now, let's keep it simple: CB tracks Exceptions (timeouts, connection errors).

            return response
        except CircuitBreakerOpenException:
            logger.warning(f"Circuit Breaker OPEN for {provider_name}")
            return LLMResponse(False, "", provider_name, "circuit_open", error="Circuit Breaker Open")
        except Exception as e:
            return LLMResponse(False, "", provider_name, "error", error=str(e))

    def _get_provider_instance(self, name: str, key: str) -> Optional[BaseLLMProvider]:
        """Factory for providers"""
        if name == "groq":
            return GroqProvider(key, model=settings.GROQ_MODEL)
        elif name == "gemini":
            return GeminiProvider(key, model=settings.GEMINI_MODEL)
        elif name == "mistral":
            return MistralProvider(key, model=settings.MISTRAL_MODEL)
        elif name == "openai":
            return OpenAIProvider(key, model=settings.OPENAI_MODEL if hasattr(settings, 'OPENAI_MODEL') else "gpt-4o-mini")
        elif name == "ollama":
            return OllamaProvider(key, model=settings.OLLAMA_MODEL)

        return None

# Global instance
llm_service = LLMService()
