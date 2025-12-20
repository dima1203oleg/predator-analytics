"""
LLM Service - Multi-provider LLM integration
Supports OpenAI, Gemini, Anthropic, and local models
"""
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
from enum import Enum
import httpx
import logging
import os
import asyncio
import random
import json
from ...core.config import settings
from libs.core.logger import setup_logger

logger = setup_logger("predator.backend.llm")


class LLMProvider(Enum):
    OPENAI = "openai"
    GEMINI = "gemini"
    ANTHROPIC = "anthropic"
    OLLAMA = "ollama"
    GROQ = "groq"
    MISTRAL = "mistral"
    OPENROUTER = "openrouter"
    HUGGINGFACE = "huggingface"
    COHERE = "cohere"
    TOGETHER = "together"
    XAI = "xai"  # Grok
    DEEPSEEK = "deepseek"


@dataclass
class LLMResponse:
    success: bool
    content: str
    provider: str
    model: str
    tokens_used: int = 0
    latency_ms: float = 0
    error: Optional[str] = None


class LLMService:
    """
    Multi-provider LLM service with fallback support
    """

    def __init__(self):
        self.providers: Dict[str, Dict[str, Any]] = {}
        self._init_providers()

    def _get_keys(self, env_key: str, setting_key: Optional[str]) -> List[str]:
        """Helper to parse API keys from env or settings (supports comma-separated)"""
        raw_key = setting_key or os.getenv(env_key)
        if not raw_key:
            return []
        return [k.strip() for k in raw_key.split(",") if k.strip()]

    def _get_keys_from_storage(self, provider: str) -> List[str]:
        """Load API keys from secure storage with fallback to environment"""
        # Try secure storage first
        try:
            from app.core.llm_keys_storage import LLMKeysStorage
            storage = LLMKeysStorage()
            keys = storage.list_keys(provider)
            if keys:
                return keys
        except Exception as e:
            logger.warning(f"Could not load {provider} keys from storage: {e}")

        # Fallback to environment variables
        env_mapping = {
            "groq": "GROQ_API_KEY",
            "mistral": "MISTRAL_API_KEY",
            "gemini": "GEMINI_API_KEY",
            "openrouter": "OPENROUTER_API_KEY"
        }
        env_key = env_mapping.get(provider, provider.upper() + "_API_KEY")
        return self._get_keys(env_key, None)

    def _init_providers(self):
        """Initialize available providers based on API keys"""

        # Load from secure storage
        self.dynamic_config = {}

        # ============================================
        # VERIFIED WORKING KEYS (From testing 2025-12-08)
        # All models are FREE or have free tier
        # ============================================

        # Groq - FAST & FREE (Llama 3.3 70B is now available)
        self.providers["groq"] = {
            "base_url": settings.LLM_GROQ_BASE_URL,
            "model": settings.GROQ_MODEL,
            "models_available": [
                "llama-3.3-70b-versatile",
                "llama-3.2-11b-vision-preview",
                "mixtral-8x7b-32768",
                "llama-3.1-8b-instant"
            ],
            "api_keys": self._get_keys_from_storage("groq")
        }

        # Mistral - RELIABLE & FREE
        self.providers["mistral"] = {
            "base_url": settings.LLM_MISTRAL_BASE_URL,
            "model": settings.MISTRAL_MODEL,
            "models_available": [
                "mistral-large-latest",
                "mistral-small-latest",
                "pixtral-12b-2409",
                "open-mixtral-8x7b"
            ],
            "api_keys": self._get_keys_from_storage("mistral")
        }

        # Gemini - POWERFUL & FREE (Gemini 2.0 Flash Exp)
        gemini_keys = self._get_keys_from_storage("gemini")
        env_gemini_keys = os.getenv("GEMINI_API_KEYS", "")
        if env_gemini_keys:
            gemini_keys.extend([k.strip() for k in env_gemini_keys.split(",") if k.strip()])

        self.providers["gemini"] = {
            "base_url": settings.LLM_GEMINI_BASE_URL,
            "model": settings.GEMINI_MODEL,
            "models_available": [
                "gemini-2.0-flash-exp",
                "gemini-1.5-pro",
                "gemini-1.5-flash"
            ],
            "api_keys": list(set(gemini_keys))
        }

        # OpenRouter - ACCESS TO MANY MODELS
        self.providers["openrouter"] = {
            "base_url": settings.LLM_OPENROUTER_BASE_URL,
            "model": settings.OPENROUTER_MODEL,
            "models_available": [
                "google/gemini-2.0-flash-exp:free",
                "mistralai/mistral-7b-instruct:free",
                "meta-llama/llama-3.2-3b-instruct:free",
                "qwen/qwen-2-7b-instruct:free"
            ],
            "api_keys": self._get_keys_from_storage("openrouter")
        }

        # Ollama - LOCAL FALLBACK
        self.providers["ollama"] = {
            "base_url": settings.LLM_OLLAMA_BASE_URL,
            "model": settings.OLLAMA_MODEL,
            "models_available": ["qwen2.5-coder:7b", "mistral", "llama3"],
            "api_key": None
        }

        # Optional providers from environment
        env_groq = self._get_keys("GROQ_API_KEY", settings.GROQ_API_KEY)
        if env_groq:
            self.providers["groq"]["api_keys"].extend(env_groq)

        env_mistral = self._get_keys("MISTRAL_API_KEY", settings.MISTRAL_API_KEY)
        if env_mistral:
            self.providers["mistral"]["api_keys"].extend(env_mistral)

        env_gemini = self._get_keys("GEMINI_API_KEY", settings.GEMINI_API_KEY)
        if env_gemini:
            self.providers["gemini"]["api_keys"].extend(env_gemini)

    def _save_to_secure_storage(self, provider: str):
        """Save provider configuration to secure storage"""
        try:
            from app.core.llm_keys_storage import LLMKeysStorage
            storage = LLMKeysStorage()
            if provider in self.providers and "api_keys" in self.providers[provider]:
                for key in self.providers[provider]["api_keys"]:
                    storage.add_key(provider, key)
            if provider in self.providers and "model" in self.providers[provider]:
                storage.set_provider_model(provider, self.providers[provider]["model"])
        except Exception as e:
            logger.error(f"Failed to save {provider} to secure storage: {e}")

    def add_api_key(self, provider: str, key: str) -> bool:
        if provider not in self.providers:
            return False
        if "api_keys" not in self.providers[provider]:
            self.providers[provider]["api_keys"] = []
        if key not in self.providers[provider]["api_keys"]:
            self.providers[provider]["api_keys"].append(key)
            self._save_to_secure_storage(provider)
            return True
        return False

    def get_available_providers(self) -> List[Dict[str, Any]]:
        return [
            {
                "id": name,
                "name": name.title(),
                "model": config["model"],
                "models_available": config.get("models_available", [config["model"]]),
                "keys_count": len(config.get("api_keys", [1])),
                "available": True
            }
            for name, config in self.providers.items()
        ]

    async def generate_with_routing(
        self,
        prompt: str,
        system: Optional[str] = None,
        mode: str = "auto",
        preferred_provider: Optional[str] = None,
        max_tokens: int = 1000,
        temperature: float = 0.7
    ) -> LLMResponse:
        fallback_chain = settings.LLM_FALLBACK_CHAIN.split(",")

        if mode == "fast":
            if "groq" in self.providers and "groq" not in fallback_chain:
                fallback_chain = ["groq"] + fallback_chain
        elif mode == "precise":
            if "gemini" in self.providers and "gemini" not in fallback_chain:
                fallback_chain = ["gemini"] + fallback_chain

        if preferred_provider and preferred_provider in self.providers:
            if preferred_provider in fallback_chain:
                fallback_chain.remove(preferred_provider)
            fallback_chain = [preferred_provider] + fallback_chain

        last_error = "No providers available"
        for provider_name in fallback_chain:
            provider_name = provider_name.strip()
            if provider_name not in self.providers:
                continue

            provider_config = self.providers[provider_name]
            if not provider_config.get("api_keys") and provider_name != "ollama":
                continue

            try:
                response = await self.generate(
                    prompt=prompt,
                    system=system,
                    provider=provider_name,
                    max_tokens=max_tokens,
                    temperature=temperature
                )
                if response.success:
                    return response
                last_error = response.error
            except Exception as e:
                logger.warning(f"Provider {provider_name} failed: {e}")
                last_error = str(e)

        return await self.generate(prompt, system, max_tokens=max_tokens, temperature=temperature)

    async def generate(
        self,
        prompt: str,
        system: str = "",
        provider: Optional[str] = None,
        max_tokens: int = 2048,
        temperature: float = 0.7
    ) -> LLMResponse:
        import time
        start_time = time.time()
        default_provider = settings.LLM_DEFAULT_PROVIDER

        if provider and provider in self.providers:
            selected_provider = provider
        elif default_provider in self.providers:
            selected_provider = default_provider
        elif "groq" in self.providers:
            selected_provider = "groq"
        elif "gemini" in self.providers:
            selected_provider = "gemini"
        elif "mistral" in self.providers:
            selected_provider = "mistral"
        elif "ollama" in self.providers:
            selected_provider = "ollama"
        else:
            return LLMResponse(False, "", "none", "none", error="No LLM provider available")

        config = self.providers[selected_provider]

        try:
            if selected_provider == "gemini":
                response = await self._call_gemini(prompt, system, config, max_tokens, temperature)
            elif selected_provider in ["groq", "mistral", "openrouter"]:
                response = await self._call_openai_compatible(prompt, system, config, max_tokens, temperature, provider_name=selected_provider)
            else:
                response = await self._call_ollama(prompt, system, config, max_tokens, temperature)

            response.latency_ms = (time.time() - start_time) * 1000
            return response
        except Exception as e:
            logger.error(f"LLM error with {selected_provider}: {e}")
            return LLMResponse(False, "", selected_provider, config["model"], error=str(e))

    async def _call_gemini(self, prompt, system, config, max_tokens, temperature):
        async with httpx.AsyncClient() as client:
            url = f"{config['base_url']}/models/{config['model']}:generateContent"
            contents = []
            if system:
                contents.append({"role": "user", "parts": [{"text": f"System: {system}"}]})
            contents.append({"role": "user", "parts": [{"text": prompt}]})
            api_key = random.choice(config["api_keys"])
            response = await client.post(url, params={"key": api_key}, json={
                "contents": contents,
                "generationConfig": {"maxOutputTokens": max_tokens, "temperature": temperature}
            }, timeout=60.0)
            data = response.json()
            text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            return LLMResponse(True, text, "gemini", config["model"])

    async def _call_openai_compatible(self, prompt, system, config, max_tokens, temperature, provider_name):
        async with httpx.AsyncClient() as client:
            messages = []
            if system:
                messages.append({"role": "system", "content": system})
            messages.append({"role": "user", "content": prompt})
            api_key = random.choice(config["api_keys"])
            headers = {"Authorization": f"Bearer {api_key}"}
            response = await client.post(f"{config['base_url']}/chat/completions", headers=headers, json={
                "model": config["model"], "messages": messages, "max_tokens": max_tokens, "temperature": temperature
            }, timeout=60.0)
            data = response.json()
            return LLMResponse(True, data["choices"][0]["message"]["content"], provider_name, config["model"])

    async def _call_ollama(self, prompt, system, config, max_tokens, temperature):
        async with httpx.AsyncClient() as client:
            full_prompt = f"{system}\n\n{prompt}" if system else prompt
            response = await client.post(f"{config['base_url']}/generate", json={
                "model": config["model"], "prompt": full_prompt, "stream": False
            }, timeout=120.0)
            data = response.json()
            return LLMResponse(True, data.get("response", ""), "ollama", config["model"])

# Singleton instance
llm_service = LLMService()

def get_llm_service() -> LLMService:
    return llm_service
