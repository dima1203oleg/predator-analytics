from __future__ import annotations

import logging

from app.libs.core.redis import get_redis


logger = logging.getLogger(__name__)

class SystemControlService:
    """Manages global system states like LOCKDOWN.
    Uses Redis for persistence across service restarts.
    """
    _instance = None
    _redis_key = "predator:v25:lockdown_active"

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._lockdown_cache = None
            cls._instance._last_check = 0
            cls._instance.maintenance_mode = False
        return cls._instance

    async def toggle_lockdown(self) -> bool:
        """Toggles lockdown state and persists in Redis."""
        current = await self.is_lockdown()
        new_state = not current

        try:
            redis = await get_redis()
            await redis.set(self._redis_key, "1" if new_state else "0")
            self._lockdown_cache = new_state
            logger.warning(f"🚨 SYSTEM LOCKDOWN state changed to: {new_state}")
        except Exception as e:
            logger.exception(f"Failed to persist lockdown state to Redis: {e}")
            self._lockdown_cache = new_state # Fallback to in-memory

        return new_state

    async def is_lockdown(self) -> bool:
        """Checks if lockdown is active. Uses cache with short TTL."""
        if self._lockdown_cache is not None:
            return self._lockdown_cache

        try:
            redis = await get_redis()
            val = await redis.get(self._redis_key)
            self._lockdown_cache = val == "1"
            return self._lockdown_cache
        except Exception as e:
            logger.exception(f"Failed to read lockdown state from Redis: {e}")
            return self._lockdown_cache or False

system_control_service = SystemControlService()
