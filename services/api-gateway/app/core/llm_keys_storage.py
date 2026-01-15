"""
Secure LLM Keys Storage for Predator Analytics v25
Loads keys from environment variables only - NO hardcoded secrets
"""
import os
import logging
from typing import List, Dict, Optional
from dataclasses import dataclass

from libs.core.structured_logger import get_logger
logger = get_logger("core.llm_keys")

@dataclass
class LLMProvider:
    name: str
    env_key: str
    models: Dict[str, str]

class LLMKeysStorage:
    """Secure storage for LLM API keys from environment variables only"""

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

    def _validate_no_hardcoded_secrets(self):
        """Ensure no hardcoded secrets exist in codebase"""
        current_dir = os.path.dirname(os.path.abspath(__file__))
        backend_dir = os.path.dirname(os.path.dirname(current_dir))

        # Check for dangerous files
        dangerous_files = [
            'dynamic_keys.json',
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

    def list_keys(self, provider: str) -> List[str]:
        """Get API keys for provider from environment"""
        if provider not in self.PROVIDERS:
            raise ValueError(f"Unknown provider: {provider}")

        env_keys = os.getenv(self.PROVIDERS[provider].env_key, "")
        if not env_keys:
            logger.warning(f"No API keys found for {provider} in {self.PROVIDERS[provider].env_key}")
            return []

        # Split comma-separated keys
        keys = [key.strip() for key in env_keys.split(",") if key.strip()]

        # Validate key format (basic check)
        for key in keys:
            if len(key) < 10:
                logger.warning(f"Suspiciously short API key for {provider}")

        return keys

    def get_primary_key(self, provider: str) -> Optional[str]:
        """Get first available key for provider"""
        keys = self.list_keys(provider)
        return keys[0] if keys else None

    def get_model(self, provider: str, model_name: str = 'default') -> str:
        """Get model name for provider"""
        if provider not in self.PROVIDERS:
            raise ValueError(f"Unknown provider: {provider}")

        return self.PROVIDERS[provider].models.get(model_name, 'default')

    def is_provider_available(self, provider: str) -> bool:
        """Check if provider has API keys configured"""
        return len(self.list_keys(provider)) > 0

    def get_available_providers(self) -> List[str]:
        """Get list of providers with API keys"""
        available = []
        for provider in self.PROVIDERS:
            if self.is_provider_available(provider):
                available.append(provider)
        return available

    def get_fallback_chain(self) -> List[str]:
        """Get ordered list of providers for fallback"""
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
    """Raised when security issues are detected"""
    pass

# Singleton instance
llm_keys_storage = LLMKeysStorage()
