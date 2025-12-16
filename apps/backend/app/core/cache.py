"""
Caching utilities for Predator Analytics
Redis-based caching with decorator support
"""
import hashlib
import json
import logging
from functools import wraps
from typing import Any, Optional, Callable
import redis.asyncio as aioredis
import os

logger = logging.getLogger(__name__)

# Global Redis client
_redis_client: Optional[aioredis.Redis] = None


async def get_redis() -> aioredis.Redis:
    """Get or create Redis client"""
    global _redis_client
    if _redis_client is None:
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        _redis_client = await aioredis.from_url(
            redis_url,
            encoding="utf-8",
            decode_responses=True,
            socket_timeout=5,
            socket_connect_timeout=5
        )
    return _redis_client


def cache_key_generator(prefix: str, func_name: str, *args, **kwargs) -> str:
    """Generate consistent cache key from function arguments"""
    # Serialize args and kwargs
    key_parts = [prefix, func_name]

    # Add args
    for arg in args:
        if hasattr(arg, '__dict__'):
            key_parts.append(str(arg.__dict__))
        else:
            key_parts.append(str(arg))

    # Add kwargs (sorted for consistency)
    for k, v in sorted(kwargs.items()):
        key_parts.append(f"{k}={v}")

    # Create hash for long keys
    key_str = ":".join(key_parts)
    if len(key_str) > 200:
        key_hash = hashlib.md5(key_str.encode()).hexdigest()
        return f"{prefix}:{func_name}:{key_hash}"

    return key_str.replace(" ", "_")


def cache_response(ttl: int = 300, prefix: str = "cache"):
    """
    Decorator for caching async function responses in Redis

    Args:
        ttl: Time to live in seconds (default 5 minutes)
        prefix: Cache key prefix

    Usage:
        @cache_response(ttl=600, prefix="search")
        async def search_documents(query: str, limit: int = 10):
            ...
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            try:
                redis = await get_redis()

                # Generate cache key
                cache_key = cache_key_generator(prefix, func.__name__, *args, **kwargs)

                # Try to get from cache
                cached = await redis.get(cache_key)
                if cached:
                    logger.debug(f"Cache HIT: {cache_key}")
                    return json.loads(cached)

                logger.debug(f"Cache MISS: {cache_key}")

                # Execute function
                result = await func(*args, **kwargs)

                # Cache result
                if result is not None:
                    await redis.setex(cache_key, ttl, json.dumps(result, default=str))

                return result

            except Exception as e:
                logger.warning(f"Cache error: {e}, executing without cache")
                return await func(*args, **kwargs)

        return wrapper
    return decorator


async def invalidate_cache(pattern: str):
    """
    Invalidate cache entries matching pattern

    Args:
        pattern: Redis key pattern (e.g., "search:*")
    """
    try:
        redis = await get_redis()
        cursor = 0
        deleted = 0

        while True:
            cursor, keys = await redis.scan(cursor, match=pattern, count=100)
            if keys:
                await redis.delete(*keys)
                deleted += len(keys)
            if cursor == 0:
                break

        logger.info(f"Invalidated {deleted} cache entries matching '{pattern}'")
        return deleted

    except Exception as e:
        logger.error(f"Cache invalidation error: {e}")
        return 0


async def get_cached(key: str) -> Optional[Any]:
    """Get value from cache"""
    try:
        redis = await get_redis()
        cached = await redis.get(key)
        if cached:
            return json.loads(cached)
        return None
    except Exception as e:
        logger.error(f"Cache get error: {e}")
        return None


async def set_cached(key: str, value: Any, ttl: int = 300):
    """Set value in cache"""
    try:
        redis = await get_redis()
        await redis.setex(key, ttl, json.dumps(value, default=str))
    except Exception as e:
        logger.error(f"Cache set error: {e}")


async def delete_cached(key: str):
    """Delete value from cache"""
    try:
        redis = await get_redis()
        await redis.delete(key)
    except Exception as e:
        logger.error(f"Cache delete error: {e}")


class CacheManager:
    """
    Cache manager for more complex caching scenarios
    """

    def __init__(self, prefix: str = "predator"):
        self.prefix = prefix
        self._redis: Optional[aioredis.Redis] = None

    async def _get_redis(self) -> aioredis.Redis:
        if self._redis is None:
            self._redis = await get_redis()
        return self._redis

    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        redis = await self._get_redis()
        full_key = f"{self.prefix}:{key}"
        cached = await redis.get(full_key)
        if cached:
            return json.loads(cached)
        return None

    async def set(self, key: str, value: Any, ttl: int = 300):
        """Set value in cache"""
        redis = await self._get_redis()
        full_key = f"{self.prefix}:{key}"
        await redis.setex(full_key, ttl, json.dumps(value, default=str))

    async def delete(self, key: str):
        """Delete value from cache"""
        redis = await self._get_redis()
        full_key = f"{self.prefix}:{key}"
        await redis.delete(full_key)

    async def invalidate_pattern(self, pattern: str):
        """Invalidate all keys matching pattern"""
        return await invalidate_cache(f"{self.prefix}:{pattern}")

    async def increment(self, key: str, amount: int = 1) -> int:
        """Increment counter and return new value"""
        redis = await self._get_redis()
        full_key = f"{self.prefix}:{key}"
        return await redis.incrby(full_key, amount)

    async def get_or_set(self, key: str, factory: Callable, ttl: int = 300) -> Any:
        """Get from cache or compute and cache"""
        cached = await self.get(key)
        if cached is not None:
            return cached

        # Compute value
        if callable(factory):
            value = await factory() if asyncio.iscoroutinefunction(factory) else factory()
        else:
            value = factory

        await self.set(key, value, ttl)
        return value


# Import asyncio for type checking
import asyncio

# Global cache manager instances
search_cache = CacheManager(prefix="search")
llm_cache = CacheManager(prefix="llm")
document_cache = CacheManager(prefix="doc")
