import logging
from typing import List, Optional

logger = logging.getLogger("app.core.llm_keys_storage")

class LLMKeysStorage:
    """
    Mock storage for LLM keys.
    In production, this would interface with Vault or an encrypted DB table.
    """
    def __init__(self):
        self._keys = {}

    def list_keys(self, provider: str) -> List[str]:
        return self._keys.get(provider, [])

    def add_key(self, provider: str, key: str):
        if provider not in self._keys:
            self._keys[provider] = []
        if key not in self._keys[provider]:
            self._keys[provider].append(key)

    def set_provider_model(self, provider: str, model: str):
        logger.info(f"Set default model for {provider} to {model}")
