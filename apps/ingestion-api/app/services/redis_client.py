import logging
from typing import Any

import redis.asyncio as redis

from app.config import settings

logger = logging.getLogger("ingestion-api.redis")

class RedisClient:
    def __init__(self):
        self.redis = None

    async def connect(self):
        try:
            self.redis = redis.from_url(settings.REDIS_URL, decode_responses=True)
            await self.redis.ping()
            logger.info("✅ Redis підключено")
        except Exception as e:
            logger.error(f"❌ Помилка підключення до Redis: {e}")
            raise e

    async def close(self):
        if self.redis:
            await self.redis.close()

    async def set_metadata(self, job_id: str, metadata: dict[str, Any], expire_seconds: int = 86400):
        """Зберегти метадані (наприклад, TUS параметри)"""
        if self.redis:
            await self.redis.hset(f"tus:{job_id}", mapping=metadata)
            await self.redis.expire(f"tus:{job_id}", expire_seconds)

    async def get_metadata(self, job_id: str) -> dict[str, str] | None:
        if self.redis:
            data = await self.redis.hgetall(f"tus:{job_id}")
            return data if data else None
        return None

redis_client = RedisClient()
