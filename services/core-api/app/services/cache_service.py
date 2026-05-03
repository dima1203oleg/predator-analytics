import json
import logging
from typing import Any, Optional
import redis.asyncio as redis
from app.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

class CacheService:
    """Сервіс для асинхронного кешування (Redis)."""

    def __init__(self):
        self._redis: Optional[redis.Redis] = None

    async def connect(self):
        """Підключення до Redis."""
        if not self._redis:
            try:
                self._redis = redis.from_url(
                    settings.REDIS_URL,
                    encoding="utf-8",
                    decode_responses=True
                )
                await self._redis.ping()
                logger.info("📡 Connected to Redis Cache")
            except Exception as e:
                logger.error(f"❌ Redis connection failed: {e}")
                self._redis = None

    async def get(self, key: str) -> Optional[Any]:
        """Отримати значення з кешу."""
        if not self._redis:
            await self.connect()
        
        if not self._redis:
            return None

        try:
            data = await self._redis.get(key)
            return json.loads(data) if data else None
        except Exception as e:
            logger.error(f"Redis get error: {e}")
            return None

    async def set(self, key: str, value: Any, ttl: int = 3600):
        """Зберегти значення в кеш з TTL (за замовчуванням 1 година)."""
        if not self._redis:
            await self.connect()
        
        if not self._redis:
            return

        try:
            await self._redis.set(
                key,
                json.dumps(value, ensure_ascii=False),
                ex=ttl
            )
        except Exception as e:
            logger.error(f"Redis set error: {e}")

    async def delete(self, key: str):
        """Видалити ключ з кешу."""
        if not self._redis:
            await self.connect()
        
        if self._redis:
            await self._redis.delete(key)

# Global singleton
cache_service = CacheService()
