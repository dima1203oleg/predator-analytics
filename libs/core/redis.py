"""
Redis Core Module
Shared Redis connection management for Predator Analytics.
"""
import redis.asyncio as redis
import logging
from typing import Optional
from .config import settings

logger = logging.getLogger("predator.redis")

class RedisClient:
    """Async Redis Client for caching and state management."""
    _instance: Optional[redis.Redis] = None

    @classmethod
    async def get_instance(cls) -> redis.Redis:
        if cls._instance is None:
            redis_url = settings.REDIS_URL
            logger.info(f"Connecting to Redis at {redis_url}...")
            try:
                cls._instance = redis.from_url(
                    redis_url,
                    decode_responses=True,
                    socket_connect_timeout=5
                )
                # Test connection
                await cls._instance.ping()
                logger.info("✅ Connected to Redis")
            except Exception as e:
                logger.error(f"❌ Redis Connection Failed: {e}")
                # Fallback to a disconnected client object that will fail gracefully or retry
                cls._instance = redis.from_url(redis_url, decode_responses=True)
        return cls._instance

    @classmethod
    async def close(cls):
        if cls._instance:
            await cls._instance.close()
            cls._instance = None

async def get_redis() -> redis.Redis:
    return await RedisClient.get_instance()
