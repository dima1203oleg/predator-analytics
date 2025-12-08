"""
Predator Analytics - LLM Router Service
Multi-provider LLM routing with fallback chain
"""
import asyncio
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
from enum import Enum
import httpx
from loguru import logger

from app.core.config import settings


class LLMProvider(str, Enum):
    OPENAI = "openai"
    GEMINI = "gemini"
    ANTHROPIC = "anthropic"
    MISTRAL = "mistral"
    GROQ = "groq"


@dataclass
class LLMResponse:
    """Standardized LLM response"""
    content: str
    provider: str
    model: str
    tokens_used: int
    latency_ms: float
    success: bool
    error: Optional[str] = None


class LLMRouter:
    """
    Multi-provider LLM Router with automatic fallback
    Supports: OpenAI, Gemini, Anthropic, Mistral, Groq
    """
    
    def __init__(self):
        self.providers: Dict[str, Dict[str, Any]] = {}
        self._init_providers()
    
    def _init_providers(self):
        """Initialize available providers based on API keys"""
        if settings.OPENAI_API_KEY:
            self.providers["openai"] = {
                "api_key": settings.OPENAI_API_KEY,
                "base_url": "https://api.openai.com/v1",
                "model": "gpt-4-turbo-preview",
                "available": True
            }
        
        if settings.GEMINI_API_KEY:
            self.providers["gemini"] = {
                "api_key": settings.GEMINI_API_KEY,
                "base_url": "https://generativelanguage.googleapis.com/v1beta",
                "model": "gemini-1.5-pro",
                "available": True
            }
        
        if settings.ANTHROPIC_API_KEY:
            self.providers["anthropic"] = {
                "api_key": settings.ANTHROPIC_API_KEY,
                "base_url": "https://api.anthropic.com/v1",
                "model": "claude-3-opus-20240229",
                "available": True
            }
        
        if settings.MISTRAL_API_KEY:
            self.providers["mistral"] = {
                "api_key": settings.MISTRAL_API_KEY,
                "base_url": "https://api.mistral.ai/v1",
                "model": "mistral-large-latest",
                "available": True
            }
        
        if settings.GROQ_API_KEY:
            self.providers["groq"] = {
                "api_key": settings.GROQ_API_KEY,
                "base_url": "https://api.groq.com/openai/v1",
                "model": "llama-3.1-70b-versatile",
                "available": True
            }
        
        logger.info(f"LLM Router initialized with providers: {list(self.providers.keys())}")
    
    async def _call_openai(self, prompt: str, system: str = "") -> LLMResponse:
        """Call OpenAI API"""
        import time
        start = time.time()
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{self.providers['openai']['base_url']}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.providers['openai']['api_key']}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.providers['openai']['model'],
                        "messages": [
                            {"role": "system", "content": system or "You are a helpful assistant."},
                            {"role": "user", "content": prompt}
                        ],
                        "max_tokens": 4096,
                        "temperature": 0.7
                    },
                    timeout=settings.LLM_TIMEOUT
                )
                response.raise_for_status()
                data = response.json()
                
                return LLMResponse(
                    content=data["choices"][0]["message"]["content"],
                    provider="openai",
                    model=self.providers['openai']['model'],
                    tokens_used=data.get("usage", {}).get("total_tokens", 0),
                    latency_ms=(time.time() - start) * 1000,
                    success=True
                )
            except Exception as e:
                logger.error(f"OpenAI error: {e}")
                return LLMResponse(
                    content="", provider="openai", model="", tokens_used=0,
                    latency_ms=(time.time() - start) * 1000,
                    success=False, error=str(e)
                )
    
    async def _call_gemini(self, prompt: str, system: str = "") -> LLMResponse:
        """Call Google Gemini API"""
        import time
        start = time.time()
        
        async with httpx.AsyncClient() as client:
            try:
                full_prompt = f"{system}\n\n{prompt}" if system else prompt
                response = await client.post(
                    f"{self.providers['gemini']['base_url']}/models/{self.providers['gemini']['model']}:generateContent",
                    params={"key": self.providers['gemini']['api_key']},
                    json={
                        "contents": [{"parts": [{"text": full_prompt}]}],
                        "generationConfig": {
                            "temperature": 0.7,
                            "maxOutputTokens": 4096
                        }
                    },
                    timeout=settings.LLM_TIMEOUT
                )
                response.raise_for_status()
                data = response.json()
                
                content = data["candidates"][0]["content"]["parts"][0]["text"]
                
                return LLMResponse(
                    content=content,
                    provider="gemini",
                    model=self.providers['gemini']['model'],
                    tokens_used=data.get("usageMetadata", {}).get("totalTokenCount", 0),
                    latency_ms=(time.time() - start) * 1000,
                    success=True
                )
            except Exception as e:
                logger.error(f"Gemini error: {e}")
                return LLMResponse(
                    content="", provider="gemini", model="", tokens_used=0,
                    latency_ms=(time.time() - start) * 1000,
                    success=False, error=str(e)
                )
    
    async def _call_anthropic(self, prompt: str, system: str = "") -> LLMResponse:
        """Call Anthropic Claude API"""
        import time
        start = time.time()
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{self.providers['anthropic']['base_url']}/messages",
                    headers={
                        "x-api-key": self.providers['anthropic']['api_key'],
                        "Content-Type": "application/json",
                        "anthropic-version": "2023-06-01"
                    },
                    json={
                        "model": self.providers['anthropic']['model'],
                        "max_tokens": 4096,
                        "system": system or "You are a helpful assistant.",
                        "messages": [{"role": "user", "content": prompt}]
                    },
                    timeout=settings.LLM_TIMEOUT
                )
                response.raise_for_status()
                data = response.json()
                
                return LLMResponse(
                    content=data["content"][0]["text"],
                    provider="anthropic",
                    model=self.providers['anthropic']['model'],
                    tokens_used=data.get("usage", {}).get("input_tokens", 0) + data.get("usage", {}).get("output_tokens", 0),
                    latency_ms=(time.time() - start) * 1000,
                    success=True
                )
            except Exception as e:
                logger.error(f"Anthropic error: {e}")
                return LLMResponse(
                    content="", provider="anthropic", model="", tokens_used=0,
                    latency_ms=(time.time() - start) * 1000,
                    success=False, error=str(e)
                )

    async def _call_mistral(self, prompt: str, system: str = "") -> LLMResponse:
        """Call Mistral AI API"""
        import time
        start = time.time()

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{self.providers['mistral']['base_url']}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.providers['mistral']['api_key']}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.providers['mistral']['model'],
                        "messages": [
                            {"role": "system", "content": system or "You are a helpful assistant."},
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.7,
                        "max_tokens": 4096
                    },
                    timeout=settings.LLM_TIMEOUT
                )
                response.raise_for_status()
                data = response.json()

                return LLMResponse(
                    content=data["choices"][0]["message"]["content"],
                    provider="mistral",
                    model=self.providers['mistral']['model'],
                    tokens_used=data.get("usage", {}).get("total_tokens", 0),
                    latency_ms=(time.time() - start) * 1000,
                    success=True
                )
            except Exception as e:
                logger.error(f"Mistral error: {e}")
                return LLMResponse(
                    content="", provider="mistral", model="", tokens_used=0,
                    latency_ms=(time.time() - start) * 1000,
                    success=False, error=str(e)
                )

    async def _call_groq(self, prompt: str, system: str = "") -> LLMResponse:
        """Call Groq API (OpenAI-compatible)"""
        import time
        start = time.time()

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{self.providers['groq']['base_url']}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.providers['groq']['api_key']}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.providers['groq']['model'],
                        "messages": [
                            {"role": "system", "content": system or "You are a helpful assistant."},
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.7,
                        "max_tokens": 4096
                    },
                    timeout=settings.LLM_TIMEOUT
                )
                response.raise_for_status()
                data = response.json()

                return LLMResponse(
                    content=data["choices"][0]["message"]["content"],
                    provider="groq",
                    model=self.providers['groq']['model'],
                    tokens_used=data.get("usage", {}).get("total_tokens", 0),
                    latency_ms=(time.time() - start) * 1000,
                    success=True
                )
            except Exception as e:
                logger.error(f"Groq error: {e}")
                return LLMResponse(
                    content="", provider="groq", model="", tokens_used=0,
                    latency_ms=(time.time() - start) * 1000,
                    success=False, error=str(e)
                )
    
    async def generate(
        self,
        prompt: str,
        system: str = "",
        provider: Optional[str] = None,
        use_fallback: bool = True
    ) -> LLMResponse:
        """
        Generate response using LLM with automatic fallback
        
        Args:
            prompt: User prompt
            system: System prompt
            provider: Specific provider to use (None = use default/fallback chain)
            use_fallback: Whether to try fallback providers on failure
        """
        if provider and provider not in self.providers:
            return LLMResponse(
                content="", provider=provider, model="", tokens_used=0,
                latency_ms=0, success=False,
                error=f"Provider '{provider}' is not configured (missing API key)"
            )

        # Determine providers to try
        if provider and provider in self.providers:
            providers_to_try = [provider]
        else:
            providers_to_try = [p for p in settings.LLM_FALLBACK_CHAIN if p in self.providers]
        
        if not providers_to_try:
            return LLMResponse(
                content="", provider="none", model="", tokens_used=0,
                latency_ms=0, success=False,
                error="No LLM providers configured. Please set API keys in environment."
            )
        
        # Try each provider in order
        for provider_name in providers_to_try:
            logger.info(f"Trying LLM provider: {provider_name}")
            
            if provider_name == "openai":
                response = await self._call_openai(prompt, system)
            elif provider_name == "gemini":
                response = await self._call_gemini(prompt, system)
            elif provider_name == "anthropic":
                response = await self._call_anthropic(prompt, system)
            elif provider_name == "mistral":
                response = await self._call_mistral(prompt, system)
            elif provider_name == "groq":
                response = await self._call_groq(prompt, system)
            else:
                logger.warning(f"LLM provider {provider_name} is configured but not implemented in router")
                response = LLMResponse(
                    content="", provider=provider_name, model="", tokens_used=0,
                    latency_ms=0, success=False, error="Provider not implemented"
                )
                if not use_fallback:
                    return response
                continue
            
            if response.success:
                logger.info(f"LLM success with {provider_name}: {response.latency_ms:.0f}ms")
                return response
            
            if not use_fallback:
                return response
            
            logger.warning(f"LLM {provider_name} failed, trying next...")
        
        return LLMResponse(
            content="", provider="none", model="", tokens_used=0,
            latency_ms=0, success=False,
            error="All LLM providers failed"
        )
    
    def get_available_providers(self) -> List[Dict[str, Any]]:
        """Get list of available providers with their status"""
        return [
            {
                "id": name,
                "name": name.title(),
                "model": config["model"],
                "available": config["available"],
                "status": "ACTIVE" if config["available"] else "INACTIVE"
            }
            for name, config in self.providers.items()
        ]


# Global instance
llm_router = LLMRouter()
