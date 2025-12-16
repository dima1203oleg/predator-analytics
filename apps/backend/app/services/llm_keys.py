"""
LLM API Key Manager with Rotation
Supports multiple keys per provider with automatic rotation on failure
"""
import os
import random
import logging
from typing import Dict, List, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
import asyncio

logger = logging.getLogger(__name__)


@dataclass
class APIKeyStatus:
    """Track API key health"""
    key: str
    provider: str
    failures: int = 0
    last_failure: Optional[datetime] = None
    last_success: Optional[datetime] = None
    is_disabled: bool = False
    cooldown_until: Optional[datetime] = None

    @property
    def masked_key(self) -> str:
        """Return masked version of key for logging"""
        if len(self.key) < 10:
            return "***"
        return f"{self.key[:6]}...{self.key[-4:]}"

    def mark_success(self):
        """Mark successful API call"""
        self.failures = 0
        self.last_success = datetime.now()
        self.cooldown_until = None

    def mark_failure(self):
        """Mark failed API call"""
        self.failures += 1
        self.last_failure = datetime.now()

        # Exponential backoff cooldown
        if self.failures >= 3:
            cooldown_minutes = min(2 ** (self.failures - 3), 60)  # Max 60 min
            self.cooldown_until = datetime.now() + timedelta(minutes=cooldown_minutes)
            logger.warning(f"Key {self.masked_key} in cooldown for {cooldown_minutes} min")

        if self.failures >= 10:
            self.is_disabled = True
            logger.error(f"Key {self.masked_key} DISABLED after {self.failures} failures")

    def is_available(self) -> bool:
        """Check if key is available for use"""
        if self.is_disabled:
            return False
        if self.cooldown_until and datetime.now() < self.cooldown_until:
            return False
        return True


class LLMKeyManager:
    """
    Manages API keys for multiple LLM providers with:
    - Multiple keys per provider
    - Automatic rotation on failure
    - Cooldown periods for failing keys
    - Load balancing across keys
    """

    # Provider configurations
    PROVIDERS_CONFIG = {
        "groq": {
            "env_key": "GROQ_API_KEYS",
            "env_single": "GROQ_API_KEY",
            "base_url": "https://api.groq.com/openai/v1",
            "default_model": "llama-3.3-70b-versatile",
            "models": ["llama-3.3-70b-versatile", "mixtral-8x7b-32768", "llama-3.1-8b-instant"]
        },
        "gemini": {
            "env_key": "GEMINI_API_KEYS",
            "env_single": "GEMINI_API_KEY",
            "base_url": "https://generativelanguage.googleapis.com/v1",
            "default_model": "gemini-2.0-flash-exp",
            "models": ["gemini-2.0-flash-exp", "gemini-1.5-flash", "gemini-1.5-pro"]
        },
        "mistral": {
            "env_key": "MISTRAL_API_KEYS",
            "env_single": "MISTRAL_API_KEY",
            "base_url": "https://api.mistral.ai/v1",
            "default_model": "mistral-large-latest",
            "models": ["mistral-large-latest", "mistral-medium-latest", "codestral-latest"]
        },
        "openai": {
            "env_key": "OPENAI_API_KEYS",
            "env_single": "OPENAI_API_KEY",
            "base_url": "https://api.openai.com/v1",
            "default_model": "gpt-4o-mini",
            "models": ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"]
        },
        "huggingface": {
            "env_key": "HUGGINGFACE_API_KEYS",
            "env_single": "HUGGINGFACE_API_KEY",
            "base_url": "https://api-inference.huggingface.co/models",
            "default_model": "meta-llama/Llama-2-70b-chat-hf",
            "models": ["meta-llama/Llama-2-70b-chat-hf", "mistralai/Mixtral-8x7B-Instruct-v0.1"]
        },
        "openrouter": {
            "env_key": "OPENROUTER_API_KEY",
            "env_single": "OPENROUTER_API_KEY",
            "base_url": "https://openrouter.ai/api/v1",
            "default_model": "meta-llama/llama-3.1-70b-instruct:free",
            "models": ["meta-llama/llama-3.1-70b-instruct:free", "google/gemma-2-9b-it:free"]
        },
        "together": {
            "env_key": "TOGETHER_API_KEY",
            "env_single": "TOGETHER_API_KEY",
            "base_url": "https://api.together.xyz/v1",
            "default_model": "meta-llama/Llama-3.3-70B-Instruct-Turbo",
            "models": ["meta-llama/Llama-3.3-70B-Instruct-Turbo", "mistralai/Mixtral-8x7B-Instruct-v0.1"]
        },
        "cohere": {
            "env_key": "COHERE_API_KEY",
            "env_single": "COHERE_API_KEY",
            "base_url": "https://api.cohere.ai/v1",
            "default_model": "command-r-plus",
            "models": ["command-r-plus", "command-r", "command"]
        },
        "deepseek": {
            "env_key": "DEEPSEEK_API_KEY",
            "env_single": "DEEPSEEK_API_KEY",
            "base_url": "https://api.deepseek.com/v1",
            "default_model": "deepseek-chat",
            "models": ["deepseek-chat", "deepseek-coder"]
        },
        "xai": {
            "env_key": "XAI_API_KEY",
            "env_single": "XAI_API_KEY",
            "base_url": "https://api.x.ai/v1",
            "default_model": "grok-beta",
            "models": ["grok-beta", "grok-3-latest"]
        },
        "ollama": {
            "env_key": "OLLAMA_BASE_URL",
            "env_single": "OLLAMA_BASE_URL",
            "base_url": os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
            "default_model": "qwen2.5-coder:7b",
            "models": ["qwen2.5-coder:7b", "llama3.2", "mistral"]
        }
    }

    def __init__(self):
        self.keys: Dict[str, List[APIKeyStatus]] = {}
        self._load_keys()
        self._current_index: Dict[str, int] = {p: 0 for p in self.PROVIDERS_CONFIG}

    def _load_keys(self):
        """Load API keys from environment"""
        for provider, config in self.PROVIDERS_CONFIG.items():
            keys = []

            # Try loading multiple keys (comma-separated)
            multi_keys = os.getenv(config["env_key"], "")
            if multi_keys:
                for key in multi_keys.split(","):
                    key = key.strip()
                    if key:
                        keys.append(APIKeyStatus(key=key, provider=provider))

            # Fall back to single key
            if not keys:
                single_key = os.getenv(config["env_single"], "")
                if single_key:
                    keys.append(APIKeyStatus(key=single_key, provider=provider))

            self.keys[provider] = keys
            if keys:
                logger.info(f"✅ {provider}: {len(keys)} key(s) loaded")
            else:
                logger.warning(f"⚠️ {provider}: No API keys configured")

    def get_available_providers(self) -> List[str]:
        """Get list of providers with available keys"""
        return [p for p, keys in self.keys.items() if any(k.is_available() for k in keys)]

    def get_key(self, provider: str) -> Optional[str]:
        """Get next available key for provider (round-robin with health check)"""
        if provider not in self.keys or not self.keys[provider]:
            return None

        keys = self.keys[provider]
        available = [k for k in keys if k.is_available()]

        if not available:
            # Try to reset cooldowns if all keys are in cooldown
            logger.warning(f"All {provider} keys unavailable, resetting cooldowns...")
            for k in keys:
                if not k.is_disabled:
                    k.cooldown_until = None
            available = [k for k in keys if k.is_available()]

        if not available:
            logger.error(f"No available keys for {provider}")
            return None

        # Round-robin selection
        idx = self._current_index.get(provider, 0) % len(available)
        self._current_index[provider] = idx + 1

        selected = available[idx]
        logger.debug(f"Using {provider} key: {selected.masked_key}")
        return selected.key

    def mark_success(self, provider: str, key: str):
        """Mark key as successful"""
        for k in self.keys.get(provider, []):
            if k.key == key:
                k.mark_success()
                break

    def mark_failure(self, provider: str, key: str):
        """Mark key as failed"""
        for k in self.keys.get(provider, []):
            if k.key == key:
                k.mark_failure()
                break

    def get_status(self) -> Dict:
        """Get status of all providers and keys"""
        status = {}
        for provider, keys in self.keys.items():
            status[provider] = {
                "total_keys": len(keys),
                "available_keys": sum(1 for k in keys if k.is_available()),
                "disabled_keys": sum(1 for k in keys if k.is_disabled),
                "in_cooldown": sum(1 for k in keys if k.cooldown_until and datetime.now() < k.cooldown_until),
                "config": self.PROVIDERS_CONFIG.get(provider, {})
            }
        return status

    def get_base_url(self, provider: str) -> str:
        """Get base URL for provider"""
        return self.PROVIDERS_CONFIG.get(provider, {}).get("base_url", "")

    def get_default_model(self, provider: str) -> str:
        """Get default model for provider"""
        return self.PROVIDERS_CONFIG.get(provider, {}).get("default_model", "")

    def get_models(self, provider: str) -> List[str]:
        """Get available models for provider"""
        return self.PROVIDERS_CONFIG.get(provider, {}).get("models", [])


# Global singleton
_key_manager: Optional[LLMKeyManager] = None

def get_key_manager() -> LLMKeyManager:
    """Get or create global key manager instance"""
    global _key_manager
    if _key_manager is None:
        _key_manager = LLMKeyManager()
    return _key_manager
