from __future__ import annotations


"""LLM Service - Multi-provider LLM integration
Supports OpenAI, Gemini, Anthropic, and local models.
"""
from dataclasses import dataclass
from enum import Enum
import os
import random
from typing import Any

import httpx

from app.core.config import settings
from app.libs.core.logger import setup_logger


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
    error: str | None = None


class LLMService:
    """Multi-provider LLM service with fallback support."""

    def __init__(self):
        self.providers: dict[str, dict[str, Any]] = {}
        self._key_cooldowns: dict[str, float] = {}  # {key_string: timestamp_blocked_until}
        self._provider_cooldowns: dict[str, float] = {}  # {provider_name: timestamp_blocked_until}

        # Usage tracking
        self._usage_stats: dict[
            str, dict[str, Any]
        ] = {}  # {provider: {"tokens": 0, "cost": 0.0, "latency_total": 0.0, "count": 0}}
        self._total_tokens = 0
        self._total_cost = 0.0

        self._init_providers()

    def _get_keys(self, env_key: str, setting_key: str | None) -> list[str]:
        """Helper to parse API keys from env or settings (supports comma-separated or JSON list)."""
        raw_key = setting_key or os.getenv(env_key)
        if not raw_key:
            return []

        raw_key = raw_key.strip()

        # Try JSON parsing if it looks like a list
        if raw_key.startswith("[") and raw_key.endswith("]"):
            try:
                import json

                keys = json.loads(raw_key)
                if isinstance(keys, list):
                    result = [str(k).strip("[]\"' ") for k in keys if k]
                    logger.info(f"Parsed keys for {env_key} (JSON): {len(result)} keys. First: {result[0][:4]}...")
                    return result
            except Exception:
                pass

        # Manual split and cleanup
        clean_key = raw_key.strip("[]\"' ")
        parts = clean_key.split(",")
        result = [p.strip("[]\"' ") for p in parts if p.strip("[]\"' ")]
        if result:
            logger.info(f"Parsed keys for {env_key} (Manual): {len(result)} keys. First: {result[0][:4]}...")
        return result

    def _get_keys_from_storage(self, provider: str) -> list[str]:
        """Load API keys from secure storage with fallback to environment."""
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
            "openrouter": "OPENROUTER_API_KEY",
        }
        env_key = env_mapping.get(provider, provider.upper() + "_API_KEY")
        return self._get_keys(env_key, None)

    def _init_providers(self):
        """Initialize available providers based on API keys."""
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
                "llama-3.1-8b-instant",
            ],
            "api_keys": self._get_keys_from_storage("groq"),
        }

        # Mistral - RELIABLE & FREE
        mistral_keys = self._get_keys_from_storage("mistral")
        mistral_keys.extend(self._get_keys("MISTRAL_API_KEYS", None))

        self.providers["mistral"] = {
            "base_url": settings.LLM_MISTRAL_BASE_URL,
            "model": settings.MISTRAL_MODEL,
            "models_available": [
                "mistral-large-latest",
                "mistral-small-latest",
                "pixtral-12b-2409",
                "open-mixtral-8x7b",
            ],
            "api_keys": list(set(mistral_keys)),
        }

        # Gemini - POWERFUL & FREE (Gemini 2.0 Flash Exp)
        gemini_keys = self._get_keys_from_storage("gemini")
        gemini_keys.extend(self._get_keys("GEMINI_API_KEYS", None))
        gemini_keys.extend(self._get_keys("GEMINI_API_KEY", None))

        self.providers["gemini"] = {
            "base_url": settings.LLM_GEMINI_BASE_URL,
            "model": settings.GEMINI_MODEL,
            "models_available": ["gemini-2.0-flash-exp", "gemini-1.5-pro", "gemini-1.5-flash"],
            "api_keys": list(set(gemini_keys)),
        }

        # OpenRouter - ACCESS TO MANY MODELS
        self.providers["openrouter"] = {
            "base_url": settings.LLM_OPENROUTER_BASE_URL,
            "model": settings.OPENROUTER_MODEL,
            "models_available": [
                "google/gemini-2.0-flash-exp:free",
                "mistralai/mistral-7b-instruct:free",
                "meta-llama/llama-3.2-3b-instruct:free",
                "qwen/qwen-2-7b-instruct:free",
            ],
            "api_keys": self._get_keys_from_storage("openrouter"),
        }

        # Ollama - LOCAL FALLBACK
        self.providers["ollama"] = {
            "base_url": settings.LLM_OLLAMA_BASE_URL,
            "model": settings.OLLAMA_MODEL,
            "models_available": ["llama3.1:8b-instruct", "qwen2.5-coder:7b", "mistral", "llama3"],
            "api_key": None,
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

        # Added Providers (2026-01-11)

        # Cohere
        self.providers["cohere"] = {
            "base_url": "https://api.cohere.ai/v1",
            "model": "command-r",
            "api_keys": self._get_keys_from_storage("cohere"),
        }

        # HuggingFace
        self.providers["huggingface"] = {
            "base_url": "https://api-inference.huggingface.co/models",
            "model": "meta-llama/Meta-Llama-3-70B-Instruct",
            "api_keys": self._get_keys_from_storage("huggingface"),
        }

        # DeepSeek
        self.providers["deepseek"] = {
            "base_url": "https://api.deepseek.com",
            "model": "deepseek-chat",
            "api_keys": self._get_keys_from_storage("deepseek"),
        }

        # Together AI
        self.providers["together"] = {
            "base_url": "https://api.together.xyz/v1",
            "model": "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
            "api_keys": self._get_keys_from_storage("together"),
        }

        # Grok (xAI)
        self.providers["grok"] = {
            "base_url": "https://api.x.ai/v1",
            "model": "grok-2-latest",
            "api_keys": self._get_keys_from_storage("grok"),
        }

    def _save_to_secure_storage(self, provider: str):
        """Save provider configuration to secure storage."""
        try:
            from app.core.llm_keys_storage import LLMKeysStorage

            storage = LLMKeysStorage()
            if provider in self.providers and "api_keys" in self.providers[provider]:
                for key in self.providers[provider]["api_keys"]:
                    storage.add_key(provider, key)
            if provider in self.providers and "model" in self.providers[provider]:
                storage.set_provider_model(provider, self.providers[provider]["model"])
        except Exception as e:
            logger.exception(f"Failed to save {provider} to secure storage: {e}")

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

    def get_available_providers(self) -> list[dict[str, Any]]:
        return [
            {
                "id": name,
                "name": name.title(),
                "model": config["model"],
                "models_available": config.get("models_available", [config["model"]]),
                "keys_count": len(config.get("api_keys", [1])),
                "available": True,
            }
            for name, config in self.providers.items()
        ]

    async def generate_with_routing(
        self,
        prompt: str,
        system: str | None = None,
        mode: str = "auto",
        preferred_provider: str | None = None,
        max_tokens: int = 1000,
        temperature: float = 0.7,
    ) -> LLMResponse:
        fallback_chain = settings.LLM_FALLBACK_CHAIN.split(",")

        if mode == "fast":
            if "groq" in self.providers and "groq" not in fallback_chain:
                fallback_chain = ["groq", *fallback_chain]
        elif mode == "precise" and "gemini" in self.providers and "gemini" not in fallback_chain:
            fallback_chain = ["gemini", *fallback_chain]

        logger.info(f"LLM_ROUTER using fallback chain: {fallback_chain} (mode={mode})")

        if preferred_provider and preferred_provider in self.providers:
            if preferred_provider in fallback_chain:
                fallback_chain.remove(preferred_provider)
            fallback_chain = [preferred_provider, *fallback_chain]

        last_error = "No providers available"
        for provider_name in fallback_chain:
            provider_name = provider_name.strip()
            if provider_name not in self.providers:
                continue

            provider_config = self.providers[provider_name]
            if not provider_config.get("api_keys") and provider_name != "ollama":
                continue

            try:
                logger.debug(f"LLM_ROUTER: Attempting {provider_name}...")
                response = await self.generate(
                    prompt=prompt, system=system, provider=provider_name, max_tokens=max_tokens, temperature=temperature
                )
                if response.success:
                    logger.info(f"LLM_ROUTER: Success with {provider_name} [Model: {response.model}]")
                    return response

                logger.warning(f"LLM_ROUTER: {provider_name} returned error: {response.error}")
                last_error = response.error
            except Exception as e:
                logger.exception(f"LLM_ROUTER: Provider {provider_name} critical failure: {e}")
                last_error = str(e)

        logger.error(f"LLM_ROUTER: All providers in chain failed. Last error: {last_error}")
        return await self.generate(prompt, system, max_tokens=max_tokens, temperature=temperature)

    async def generate(
        self,
        prompt: str,
        system: str | None = "",
        provider: str | None = None,
        max_tokens: int = 2048,
        temperature: float = 0.7,
        format: str | None = None,
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
        keys = config.get("api_keys", [None])
        if not keys and selected_provider != "ollama":
            return LLMResponse(False, "", selected_provider, config["model"], error="No API keys available")

        import time

        current_time = time.time()

        # Check provider cooldown
        if self._provider_cooldowns.get(selected_provider, 0) > current_time:
            remaining = int(self._provider_cooldowns[selected_provider] - current_time)
            return LLMResponse(
                False,
                "",
                selected_provider,
                config["model"],
                error=f"Provider {selected_provider} is on cooldown for {remaining}s",
            )

        # Try keys for this provider
        last_err_msg = "Unknown error"
        keys_attempted = 0

        for api_key in keys:
            # Ollama doesn't need a key
            if not api_key and selected_provider != "ollama":
                continue

            api_key = str(api_key).strip("[]\"' ")
            if not api_key:
                continue

            # Check key cooldown
            if self._key_cooldowns.get(api_key, 0) > current_time:
                continue

            keys_attempted += 1
            try:
                if selected_provider == "gemini":
                    response = await self._call_gemini(
                        prompt, system, config, max_tokens, temperature, format, api_key=api_key
                    )
                elif selected_provider in ["groq", "mistral", "openrouter", "deepseek", "together", "grok"]:
                    response = await self._call_openai_compatible(
                        prompt, system, config, max_tokens, temperature, selected_provider, format, api_key=api_key
                    )
                elif selected_provider == "cohere":
                    response = await self._call_cohere(prompt, system, config, max_tokens, temperature, api_key=api_key)
                elif selected_provider == "huggingface":
                    response = await self._call_huggingface(
                        prompt, system, config, max_tokens, temperature, api_key=api_key
                    )
                else:  # Ollama does not use api_key
                    response = await self._call_ollama(prompt, system, config, max_tokens, temperature)

                if response.success:
                    response.latency_ms = (time.time() - start_time) * 1000
                    self._update_stats(response)
                    return response

                # Handle errors and apply cooldowns
                err_str = str(response.error).lower()

                # 429: Rate Limit
                if "429" in err_str or "rate limit" in err_str or "quota exceeded" in err_str:
                    logger.warning(f"LLM key 429 for {selected_provider}, cooling down for 60s...")
                    self._key_cooldowns[api_key] = current_time + 60
                    last_err_msg = response.error
                    continue

                # 401/403: Unauthorized/Invalid key
                if "401" in err_str or "403" in err_str or "unauthorized" in err_str or "invalid api key" in err_str:
                    logger.error(f"LLM key 401 for {selected_provider}, cooling down for 1 hour (invalid)...")
                    self._key_cooldowns[api_key] = current_time + 3600
                    last_err_msg = response.error
                    continue

                # For other errors, return the response
                return response

            except Exception as e:
                logger.exception(f"LLM exception with {selected_provider} and key {api_key[:8]}...: {e}")
                last_err_msg = str(e)
                continue

        # If we exhausted all available keys
        if keys_attempted > 0:
            logger.warning(
                f"All available keys for {selected_provider} are on cooldown or failed. Provider cooldown: 30s"
            )
            self._provider_cooldowns[selected_provider] = current_time + 30

        return LLMResponse(
            False,
            "",
            selected_provider,
            config["model"],
            error=f"All keys failed or cooling down for {selected_provider}. Last error: {last_err_msg}",
        )

    def _update_stats(self, response: LLMResponse):
        """Update internal usage statistics."""
        if not response.success:
            return

        p = response.provider
        if p not in self._usage_stats:
            self._usage_stats[p] = {"tokens": 0, "cost": 0.0, "latency_total": 0.0, "count": 0}

        stats = self._usage_stats[p]
        stats["tokens"] += response.tokens_used
        stats["latency_total"] += response.latency_ms
        stats["count"] += 1

        # Rough cost estimation (placeholder for real dynamic rates)
        rate = 0.0
        if "pro" in response.model.lower() or "large" in response.model.lower():
            rate = 0.000015  # $15 per 1M tokens
        else:
            rate = 0.000002  # $2 per 1M tokens

        cost = response.tokens_used * rate
        stats["cost"] += cost

        self._total_tokens += response.tokens_used
        self._total_cost += cost

    def get_usage_stats(self) -> dict[str, Any]:
        """Get summarized usage statistics."""
        return {
            "total_tokens": self._total_tokens,
            "total_cost": round(self._total_cost, 4),
            "providers": self._usage_stats,
        }

    async def _call_cohere(self, prompt, system, config, max_tokens, temperature, api_key=None):
        async with httpx.AsyncClient() as client:
            selected_key = api_key or random.choice(config["api_keys"])
            headers = {
                "Authorization": f"Bearer {selected_key}",
                "Content-Type": "application/json",
                "Request-Source": "python-client",  # optional
            }
            # Cohere chat endpoint
            payload = {
                "model": config["model"],
                "message": prompt,
                "preamble": system,
                "max_tokens": max_tokens,
                "temperature": temperature,
            }
            response = await client.post(f"{config['base_url']}/chat", headers=headers, json=payload, timeout=60.0)
            data = response.json()
            if response.status_code != 200:
                return LLMResponse(False, "", "cohere", config["model"], error=f"Cohere Error: {data}")

            return LLMResponse(True, data.get("text", ""), "cohere", config["model"])

    async def _call_huggingface(self, prompt, system, config, max_tokens, temperature, api_key=None):
        # Using serverless inference API
        async with httpx.AsyncClient() as client:
            selected_key = api_key or random.choice(config["api_keys"])
            headers = {"Authorization": f"Bearer {selected_key}"}
            # HF Prompt structuring depends on model, but usually pure generation
            full_prompt = f"{system}\nUser: {prompt}\nAssistant:" if system else f"User: {prompt}\nAssistant:"

            payload = {
                "inputs": full_prompt,
                "parameters": {"max_new_tokens": max_tokens, "temperature": temperature, "return_full_text": False},
            }
            # config['model'] should be the full path e.g. "meta-llama/Meta-Llama-3-8B-Instruct"
            url = f"{config['base_url']}/{config['model']}"
            response = await client.post(url, headers=headers, json=payload, timeout=60.0)
            data = response.json()

            if isinstance(data, list) and len(data) > 0 and "generated_text" in data[0]:
                return LLMResponse(True, data[0]["generated_text"], "huggingface", config["model"])

            return LLMResponse(False, "", "huggingface", config["model"], error=f"HF Error: {data}")

    async def _call_gemini(self, prompt, system, config, max_tokens, temperature, format=None, api_key=None):
        async with httpx.AsyncClient() as client:
            url = f"{config['base_url']}/models/{config['model']}:generateContent"
            contents = []
            if system:
                contents.append({"role": "user", "parts": [{"text": f"System: {system}"}]})
            contents.append({"role": "user", "parts": [{"text": prompt}]})
            selected_key = api_key or random.choice(config["api_keys"])
            response = await client.post(
                url,
                params={"key": selected_key},
                json={
                    "contents": contents,
                    "generationConfig": {"maxOutputTokens": max_tokens, "temperature": temperature},
                },
                timeout=60.0,
            )
            data = response.json()
            if response.status_code != 200:
                logger.error(f"Gemini API Error {response.status_code}: {data}")
                return LLMResponse(False, "", "gemini", config["model"], error=f"Gemini API Error: {data}")

            text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")

            # Gemini doesn't report tokens in the same way, but let's estimate
            # or try to find in response (usageMetadata)
            usage = data.get("usageMetadata", {})
            tokens = usage.get("totalTokenCount", len(prompt.split()) + len(text.split()) + 20)

            return LLMResponse(True, text, "gemini", config["model"], tokens_used=tokens)

    async def _call_openai_compatible(
        self, prompt, system, config, max_tokens, temperature, provider_name, format=None, api_key=None
    ):
        async with httpx.AsyncClient() as client:
            messages = []
            if system:
                messages.append({"role": "system", "content": system})
            messages.append({"role": "user", "content": prompt})
            selected_key = api_key or random.choice(config["api_keys"])
            headers = {"Authorization": f"Bearer {selected_key}"}

            payload = {
                "model": config["model"],
                "messages": messages,
                "max_tokens": max_tokens,
                "temperature": temperature,
            }
            if format == "json":
                payload["response_format"] = {"type": "json_object"}

            response = await client.post(
                f"{config['base_url']}/chat/completions", headers=headers, json=payload, timeout=60.0
            )

            if response.status_code != 200:
                try:
                    data = response.json()
                    err_msg = data.get("error", {}).get("message", response.text)
                except:
                    err_msg = response.text
                logger.error(f"{provider_name} error {response.status_code}: {err_msg}")
                return LLMResponse(
                    False,
                    "",
                    provider_name,
                    config["model"],
                    error=f"{provider_name} API Error {response.status_code}: {err_msg}",
                )

            try:
                data = response.json()
            except Exception:
                logger.exception(f"{provider_name} failed to parse JSON: {response.text}")
                return LLMResponse(False, "", provider_name, config["model"], error=f"{provider_name} JSON Parse Error")

            if "choices" not in data:
                logger.error(f"{provider_name} unexpected response: {data}")
                return LLMResponse(
                    False, "", provider_name, config["model"], error=f"{provider_name} Error: No choices"
                )

            usage = data.get("usage", {})
            tokens = usage.get("total_tokens", 0)
            if tokens == 0:  # Fallback estimate
                tokens = len(prompt.split()) + len(data["choices"][0]["message"]["content"].split()) + 20

            return LLMResponse(
                True, data["choices"][0]["message"]["content"], provider_name, config["model"], tokens_used=tokens
            )

    async def _call_ollama(self, prompt, system, config, max_tokens, temperature):
        async with httpx.AsyncClient() as client:
            full_prompt = f"{system}\n\n{prompt}" if system else prompt
            response = await client.post(
                f"{config['base_url']}/generate",
                json={"model": config["model"], "prompt": full_prompt, "stream": False},
                timeout=120.0,
            )

            data = response.json()
            if response.status_code != 200:
                error_msg = data.get("error", "Unknown Ollama Error")
                logger.error(f"Ollama error: {error_msg}")
                return LLMResponse(False, "", "ollama", config["model"], error=error_msg)

            return LLMResponse(True, data.get("response", ""), "ollama", config["model"])


# Singleton instance
llm_service = LLMService()


def get_llm_service() -> LLMService:
    return llm_service
