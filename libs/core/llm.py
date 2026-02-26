import os
import httpx
import logging
import asyncio
import random
import json
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
from enum import Enum

from libs.core.config import settings
from libs.core.logger import setup_logger

logger = setup_logger("predator.core.llm")

class LLMProvider(Enum):
    OPENAI = "openai"
    GEMINI = "gemini"
    ANTHROPIC = "anthropic"
    OLLAMA = "ollama"
    GROQ = "groq"
    MISTRAL = "mistral"
    OPENROUTER = "openrouter"
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
    Multi-provider LLM service with fallback support.
    Shared core library version.
    """
    def __init__(self):
        self.providers: Dict[str, Dict[str, Any]] = {}
        self._init_providers()

    def _init_providers(self):
        # Groq
        self.providers["groq"] = {
            "base_url": settings.LLM_GROQ_BASE_URL,
            "model": settings.GROQ_MODEL,
            "api_keys": [k.strip() for k in (settings.GROQ_API_KEY or "").split(",") if k.strip()]
        }
        # Mistral
        self.providers["mistral"] = {
            "base_url": settings.LLM_MISTRAL_BASE_URL,
            "model": settings.MISTRAL_MODEL,
            "api_keys": [k.strip() for k in (settings.MISTRAL_API_KEY or "").split(",") if k.strip()]
        }
        # Gemini
        gemini_keys = [k.strip() for k in (settings.GEMINI_API_KEY or "").split(",") if k.strip()]
        self.providers["gemini"] = {
            "base_url": settings.LLM_GEMINI_BASE_URL,
            "model": settings.GEMINI_MODEL,
            "api_keys": gemini_keys
        }
        # Ollama
        self.providers["ollama"] = {
            "base_url": settings.LLM_OLLAMA_BASE_URL,
            "model": settings.OLLAMA_MODEL,
            "api_key": None
        }

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
        
        selected_provider = provider or settings.LLM_DEFAULT_PROVIDER
        if selected_provider not in self.providers:
            # Simple fallback logic
            for p in ["groq", "gemini", "mistral", "ollama"]:
                if p in self.providers and self.providers[p].get("api_keys" if p != "ollama" else "base_url"):
                    selected_provider = p
                    break
        
        if selected_provider not in self.providers:
            return LLMResponse(False, "", "none", "none", error="No LLM provider available")

        config = self.providers[selected_provider]

        try:
            if selected_provider == "gemini":
                response = await self._call_gemini(prompt, system, config, max_tokens, temperature)
            elif selected_provider in ["groq", "mistral"]:
                response = await self._call_openai_compatible(prompt, system, config, max_tokens, temperature, provider_name=selected_provider)
            else:
                response = await self._call_ollama(prompt, system, config, max_tokens, temperature)

            response.latency_ms = (time.time() - start_time) * 1000
            return response
        except Exception as e:
            logger.error(f"LLM error with {selected_provider}: {e}")
            return LLMResponse(False, "", selected_provider, str(config.get("model")), error=str(e))

    async def _call_gemini(self, prompt, system, config, max_tokens, temperature):
        async with httpx.AsyncClient() as client:
            url = f"{config['base_url']}/models/{config['model']}:generateContent"
            contents = []
            if system:
                contents.append({"role": "user", "parts": [{"text": f"System: {system}"}]})
            contents.append({"role": "user", "parts": [{"text": prompt}]})
            
            if not config["api_keys"]:
                raise ValueError("No Gemini API keys configured")
                
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
            
            if not config["api_keys"]:
                raise ValueError(f"No API keys for {provider_name}")
                
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

# Singleton
llm_service = LLMService()
