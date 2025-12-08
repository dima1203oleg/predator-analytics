"""
LLM Keys Storage Service
Зберігання та управління LLM API ключами
Fallback: file-based storage якщо Vault недоступний
"""
import json
import os
from typing import List, Dict, Any, Optional
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

# Storage file
KEYS_FILE = Path(__file__).parent.parent.parent / "config" / "llm_keys.json"


class LLMKeysStorage:
    """Управління LLM ключами"""
    
    def __init__(self):
        self.keys_file = KEYS_FILE
        self._ensure_file()
    
    def _ensure_file(self):
        """Створити файл якщо не існує"""
        self.keys_file.parent.mkdir(parents=True, exist_ok=True)
        if not self.keys_file.exists():
            self._save_keys({})
    
    def _load_keys(self) -> Dict[str, Any]:
        """Завантажити ключі"""
        try:
            with open(self.keys_file, 'r') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to load keys: {e}")
            return {}
    
    def _save_keys(self, keys: Dict[str, Any]) -> bool:
        """Зберегти ключі"""
        try:
            with open(self.keys_file, 'w') as f:
                json.dump(keys, f, indent=2)
            return True
        except Exception as e:
            logger.error(f"Failed to save keys: {e}")
            return False
    
    async def add_llm_key(self, provider_id: str, api_key: str) -> bool:
        """Додати API ключ"""
        keys = self._load_keys()
        
        if provider_id not in keys:
            keys[provider_id] = {"api_keys": [], "enabled": True}
        
        # Додати тільки якщо ще немає
        if api_key not in keys[provider_id]["api_keys"]:
            keys[provider_id]["api_keys"].append(api_key)
            return self._save_keys(keys)
        
        return True
    
    async def remove_llm_key(self, provider_id: str, key_index: int) -> bool:
        """Видалити API ключ"""
        keys = self._load_keys()
        
        if provider_id in keys and "api_keys" in keys[provider_id]:
            if 0 <= key_index < len(keys[provider_id]["api_keys"]):
                keys[provider_id]["api_keys"].pop(key_index)
                return self._save_keys(keys)
        
        return False
    
    async def get_provider_keys(self, provider_id: str) -> List[str]:
        """Отримати ключі провайдера"""
        keys = self._load_keys()
        return keys.get(provider_id, {}).get("api_keys", [])
    
    async def get_all_keys(self) -> Dict[str, Any]:
        """Отримати всі ключі"""
        return self._load_keys()
    
    async def update_provider_settings(
        self,
        provider_id: str,
        enabled: Optional[bool] = None,
        model: Optional[str] = None
    ) -> bool:
        """Оновити налаштування провайдера"""
        keys = self._load_keys()
        
        if provider_id not in keys:
            keys[provider_id] = {"api_keys": [], "enabled": True}
        
        if enabled is not None:
            keys[provider_id]["enabled"] = enabled
        
        if model is not None:
            keys[provider_id]["model"] = model
        
        return self._save_keys(keys)
    
    async def is_provider_enabled(self, provider_id: str) -> bool:
        """Чи включений провайдер"""
        keys = self._load_keys()
        return keys.get(provider_id, {}).get("enabled", True)


# Singleton
llm_keys_storage = LLMKeysStorage()


# Додамо методи до vault_service для compatibility
from ..services.vault_service import vault_service

# Monkey patch VaultService
vault_service.add_llm_key = llm_keys_storage.add_llm_key
vault_service.remove_llm_key = llm_keys_storage.remove_llm_key
vault_service.get_provider_keys = llm_keys_storage.get_provider_keys
vault_service.update_provider_settings = llm_keys_storage.update_provider_settings
vault_service.get_all_llm_keys = llm_keys_storage.get_all_keys
