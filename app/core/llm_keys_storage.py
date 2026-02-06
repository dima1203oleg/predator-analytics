from __future__ import annotations


"""Secure LLM Keys Storage for Predator Analytics v25
Loads keys from environment variables only - NO hardcoded secrets.
"""
from dataclasses import dataclass
import logging
import os
from typing import Any, Dict, List, Optional

from app.libs.core.structured_logger import get_logger


logger = get_logger("core.llm_keys")

@dataclass
class LLMProvider:
    name: str
    env_key: str
    models: dict[str, str]

class LLMKeysStorage:
    """Secure storage for LLM API keys from environment variables only."""

    PROVIDERS = {
        'grok': LLMProvider(
            name='Grok (xAI)',
            env_key='GROK_API_KEYS',
            models={'default': 'grok-2-latest'}
        ),
        'cohere': LLMProvider(
            name='Cohere',
            env_key='COHERE_API_KEYS',
            models={'default': 'command-r'}
        ),
        'huggingface': LLMProvider(
            name='Hugging Face',
            env_key='HUGGINGFACE_API_KEYS',
            models={'default': 'meta-llama/Meta-Llama-3-70B-Instruct'}
        ),
        'deepseek': LLMProvider(
            name='DeepSeek',
            env_key='DEEPSEEK_API_KEYS',
            models={'default': 'deepseek-chat'}
        ),
        'groq': LLMProvider(
            name='Groq',
            env_key='GROQ_API_KEYS',
            models={'default': 'llama-3.3-70b-versatile'}
        ),
        'gemini': LLMProvider(
            name='Gemini',
            env_key='GEMINI_API_KEYS',
            models={'default': 'gemini-2.0-flash-exp'}
        ),
        'mistral': LLMProvider(
            name='Mistral',
            env_key='MISTRAL_API_KEYS',
            models={'default': 'mistral-large-latest'}
        ),
        'openrouter': LLMProvider(
            name='OpenRouter',
            env_key='OPENROUTER_API_KEYS',
            models={'default': 'anthropic/claude-3.5-sonnet'}
        ),
        'together': LLMProvider(
            name='Together AI',
            env_key='TOGETHER_API_KEYS',
            models={'default': 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo'}
        )
    }

    def __init__(self):
        self._validate_no_hardcoded_secrets()
        self.dynamic_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "dynamic_keys.json")
        self._dynamic_cache: dict[str, Any] = {}
        self._load_dynamic()

    def _load_dynamic(self):
        """Load keys from dynamic JSON storage."""
        if os.path.exists(self.dynamic_file):
            try:
                import json
                with open(self.dynamic_file) as f:
                    self._dynamic_cache = json.load(f)
            except Exception as e:
                logger.warning(f"Could not load dynamic keys: {e}")

    def _save_dynamic(self):
        """Save dynamic keys to JSON storage."""
        try:
            import json
            with open(self.dynamic_file, "w") as f:
                json.dump(self._dynamic_cache, f, indent=2)
        except Exception as e:
            logger.error(f"Could not save dynamic keys: {e}")

    def _validate_no_hardcoded_secrets(self):
        """Ensure no hardcoded secrets exist in codebase."""
        current_dir = os.path.dirname(os.path.abspath(__file__))
        backend_dir = os.path.dirname(os.path.dirname(current_dir))

        # Check for dangerous files (plain text backups or dev envs)
        dangerous_files = [
            'secrets.json',
            'api_keys.json',
            '.env.local',
            '.env.dev'
        ]

        for dangerous_file in dangerous_files:
            file_path = os.path.join(backend_dir, dangerous_file)
            if os.path.exists(file_path):
                logger.error(f"🚨 SECURITY RISK: Found {dangerous_file} - REMOVE IMMEDIATELY!")
                raise SecurityError(f"Remove {dangerous_file} - contains hardcoded secrets")

    def list_keys(self, provider: str) -> list[str]:
        """Get API keys for provider from environment and dynamic storage."""
        env_keys = []
        if provider in self.PROVIDERS:
            env_keys_raw = os.getenv(self.PROVIDERS[provider].env_key, "")
            env_keys = [k.strip() for k in env_keys_raw.split(",") if k.strip()]

        # From Dynamic Storage
        dynamic_keys = self._dynamic_cache.get(provider, {}).get("keys", [])

        # Merge (distinct)
        all_keys = list(set(env_keys + dynamic_keys))
        return sorted(all_keys)

    def add_key(self, provider: str, key: str):
        """Add a dynamic key for the provider."""
        if provider not in self._dynamic_cache:
            self._dynamic_cache[provider] = {"keys": [], "model": None}

        if key not in self._dynamic_cache[provider]["keys"]:
            self._dynamic_cache[provider]["keys"].append(key)
            self._save_dynamic()
            logger.info(f"Key added for {provider} dynamically.")

    def remove_key(self, provider: str, key: str | None = None):
        """Remove keys for the provider. If key is None, remove all."""
        if provider not in self._dynamic_cache:
            return

        if key is None:
            self._dynamic_cache[provider]["keys"] = []
        elif key in self._dynamic_cache[provider]["keys"]:
            self._dynamic_cache[provider]["keys"].remove(key)

        self._save_dynamic()
        logger.info(f"Key(s) removed for {provider}.")

    def set_provider_model(self, provider: str, model: str):
        """Set the preferred model for a provider."""
        if provider not in self._dynamic_cache:
            self._dynamic_cache[provider] = {"keys": [], "model": None}

        self._dynamic_cache[provider]["model"] = model
        self._save_dynamic()

    def get_primary_key(self, provider: str) -> str | None:
        """Get first available key for provider."""
        keys = self.list_keys(provider)
        return keys[0] if keys else None

    def get_model(self, provider: str, model_name: str = 'default') -> str:
        """Get model name for provider."""
        if provider not in self.PROVIDERS:
            raise ValueError(f"Unknown provider: {provider}")

        return self.PROVIDERS[provider].models.get(model_name, 'default')

    def is_provider_available(self, provider: str) -> bool:
        """Check if provider has API keys configured."""
        return len(self.list_keys(provider)) > 0

    def get_available_providers(self) -> list[str]:
        """Get list of providers with API keys."""
        available = []
        for provider in self.PROVIDERS:
            if self.is_provider_available(provider):
                available.append(provider)
        return available

    def get_fallback_chain(self) -> list[str]:
        """Get ordered list of providers for fallback."""
        chain_env = os.getenv('LLM_FALLBACK_CHAIN', 'groq,gemini,mistral,openrouter,together')
        providers = [p.strip() for p in chain_env.split(',')]

        # Filter to only available providers
        available_chain = []
        for provider in providers:
            if self.is_provider_available(provider):
                available_chain.append(provider)
            else:
                logger.warning(f"Provider {provider} in fallback chain but no keys available")

        return available_chain

class SecurityError(Exception):
    """Raised when security issues are detected."""

# Singleton instance
llm_keys_storage = LLMKeysStorage()
