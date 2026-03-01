from __future__ import annotations


"""🚀 Redis Caching Service для Predator Analytics v45.

Production-ready caching layer для оптимізації performance:
- Search results caching
- ML model predictions caching
- Database query results caching
- API response caching
- Distributed lock механізм

Features:
- Automatic cache invalidation
- TTL management
- Cache warming
- Hit/miss metrics
- Compression для великих objects
"""

from functools import wraps
import hashlib
import json
import os
import pickle
from typing import TYPE_CHECKING, Any, TypeVar
import zlib

import redis.asyncio as redis

from app.libs.core.structured_logger import get_logger


if TYPE_CHECKING:
    from collections.abc import Callable


logger = get_logger("predator.cache")

# Type variable для generic caching
T = TypeVar("T")


# ═══════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════

REDIS_HOST = os.getenv("REDIS_HOST", "redis")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_DB = int(os.getenv("REDIS_CACHE_DB", "1"))  # DB 1 для cache
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", None)

# Cache TTLs (seconds)
TTL_SHORT = 60  # 1 minute
TTL_MEDIUM = 300  # 5 minutes
TTL_LONG = 3600  # 1 hour
TTL_DAY = 86400  # 24 hours

# Compression threshold (bytes)
COMPRESSION_THRESHOLD = 1024  # Compress if > 1KB


# ═══════════════════════════════════════════════════════════════════════════
# CACHE SERVICE
# ═══════════════════════════════════════════════════════════════════════════


class CacheService:
    """Production-ready Redis caching service.

    Features:
    - Automatic serialization/deserialization
    - Compression для великих objects
    - TTL management
    - Hit/miss metrics
    - Namespace support
    """

    def __init__(self, namespace: str = "predator"):
        self.namespace = namespace
        self.redis: redis.Redis | None = None

        # Metrics
        self.hits = 0
        self.misses = 0
        self.errors = 0

    async def connect(self):
        """Initialize Redis connection."""
        if self.redis is None:
            self.redis = await redis.Redis(
                host=REDIS_HOST,
                port=REDIS_PORT,
                db=REDIS_DB,
                password=REDIS_PASSWORD,
                decode_responses=False,  # Binary mode для pickle
                socket_connect_timeout=5,
                socket_timeout=5,
            )

            logger.info("redis_connected", host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB, namespace=self.namespace)

    async def close(self):
        """Close Redis connection."""
        if self.redis:
            await self.redis.close()
            logger.info("redis_disconnected")

    def _make_key(self, key: str) -> str:
        """Generate namespaced cache key."""
        return f"{self.namespace}:{key}"

    def _hash_key(self, data: Any) -> str:
        """Generate hash from complex data structure."""
        serialized = json.dumps(data, sort_keys=True)
        return hashlib.md5(serialized.encode()).hexdigest()

    def _serialize(self, value: Any) -> bytes:
        """Serialize value with optional compression."""
        pickled = pickle.dumps(value)

        # Compress if large
        if len(pickled) > COMPRESSION_THRESHOLD:
            compressed = zlib.compress(pickled)
            logger.debug(
                "cache_compressed",
                original_size=len(pickled),
                compressed_size=len(compressed),
                ratio=f"{len(compressed) / len(pickled):.2%}",
            )
            return b"COMPRESSED:" + compressed

        return pickled

    def _deserialize(self, data: bytes) -> Any:
        """Deserialize value with decompression if needed."""
        if data.startswith(b"COMPRESSED:"):
            compressed = data[11:]  # Remove prefix
            pickled = zlib.decompress(compressed)
        else:
            pickled = data

        return pickle.loads(pickled)

    async def get(self, key: str) -> Any | None:
        """Get value from cache.

        Args:
            key: Cache key

        Returns:
            Cached value or None if not found
        """
        await self.connect()

        try:
            full_key = self._make_key(key)
            data = await self.redis.get(full_key)

            if data is None:
                self.misses += 1
                logger.debug("cache_miss", key=key)
                return None

            self.hits += 1
            value = self._deserialize(data)

            logger.debug("cache_hit", key=key)
            return value

        except Exception as e:
            self.errors += 1
            logger.exception("cache_get_error", key=key, error=str(e))
            return None

    async def set(self, key: str, value: Any, ttl: int = TTL_MEDIUM) -> bool:
        """Set value in cache.

        Args:
            key: Cache key
            value: Value to cache
            ttl: Time to live in seconds

        Returns:
            True if successful
        """
        await self.connect()

        try:
            full_key = self._make_key(key)
            data = self._serialize(value)

            await self.redis.setex(full_key, ttl, data)

            logger.debug("cache_set", key=key, ttl=ttl, size=len(data))
            return True

        except Exception as e:
            self.errors += 1
            logger.exception("cache_set_error", key=key, error=str(e))
            return False

    async def delete(self, key: str) -> bool:
        """Delete key from cache."""
        await self.connect()

        try:
            full_key = self._make_key(key)
            await self.redis.delete(full_key)

            logger.debug("cache_delete", key=key)
            return True

        except Exception as e:
            logger.exception("cache_delete_error", key=key, error=str(e))
            return False

    async def invalidate_pattern(self, pattern: str) -> int:
        """Invalidate all keys matching pattern.

        Args:
            pattern: Key pattern (e.g. "search:*")

        Returns:
            Number of keys deleted
        """
        await self.connect()

        try:
            full_pattern = self._make_key(pattern)
            keys = []

            async for key in self.redis.scan_iter(match=full_pattern):
                keys.append(key)

            if keys:
                deleted = await self.redis.delete(*keys)
                logger.info("cache_pattern_invalidated", pattern=pattern, deleted=deleted)
                return deleted

            return 0

        except Exception as e:
            logger.exception("cache_invalidate_error", pattern=pattern, error=str(e))
            return 0

    async def exists(self, key: str) -> bool:
        """Check if key exists."""
        await self.connect()
        full_key = self._make_key(key)
        return bool(await self.redis.exists(full_key))

    async def get_ttl(self, key: str) -> int:
        """Get remaining TTL for key."""
        await self.connect()
        full_key = self._make_key(key)
        return await self.redis.ttl(full_key)

    def get_stats(self) -> dict:
        """Get cache statistics."""
        total_requests = self.hits + self.misses
        hit_rate = (self.hits / total_requests * 100) if total_requests > 0 else 0

        return {
            "hits": self.hits,
            "misses": self.misses,
            "errors": self.errors,
            "total_requests": total_requests,
            "hit_rate_percent": round(hit_rate, 2),
        }

    # ═══════════════════════════════════════════════════════════════════════
    # DECORATOR for function caching
    # ═══════════════════════════════════════════════════════════════════════

    def cached(self, ttl: int = TTL_MEDIUM, key_prefix: str = "", key_builder: Callable | None = None):
        """Decorator для автоматичного кешування функцій.

        Args:
            ttl: Cache TTL in seconds
            key_prefix: Prefix для cache key
            key_builder: Custom function для генерації cache key

        Usage:
            @cache.cached(ttl=600, key_prefix="search")
            async def search_documents(query: str, limit: int):
                return expensive_search(query, limit)
        """

        def decorator(func):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                # Generate cache key
                if key_builder:
                    cache_key = key_builder(*args, **kwargs)
                else:
                    # Default: use function name + args hash
                    args_hash = self._hash_key({"args": args, "kwargs": kwargs})
                    cache_key = f"{key_prefix}:{func.__name__}:{args_hash}"

                # Try cache
                cached_value = await self.get(cache_key)
                if cached_value is not None:
                    logger.debug("function_cache_hit", function=func.__name__, key=cache_key)
                    return cached_value

                # Execute function
                logger.debug("function_cache_miss", function=func.__name__, key=cache_key)
                result = await func(*args, **kwargs)

                # Cache result
                await self.set(cache_key, result, ttl)

                return result

            return wrapper

        return decorator


# ═══════════════════════════════════════════════════════════════════════════
# SPECIALIZED CACHE SERVICES
# ═══════════════════════════════════════════════════════════════════════════


class SearchCache(CacheService):
    """Specialized cache для search results."""

    def __init__(self):
        super().__init__(namespace="search")

    def make_search_key(self, query: str, mode: str, filters: dict | None = None) -> str:
        """Generate cache key для search query."""
        key_data = {"query": query.lower().strip(), "mode": mode, "filters": filters or {}}
        return self._hash_key(key_data)

    async def cache_search_results(
        self, query: str, mode: str, results: list, filters: dict | None = None, ttl: int = TTL_MEDIUM
    ):
        """Cache search results."""
        key = self.make_search_key(query, mode, filters)
        await self.set(key, results, ttl)

        logger.info("search_results_cached", query=query, mode=mode, results_count=len(results), ttl=ttl)

    async def get_cached_search(self, query: str, mode: str, filters: dict | None = None) -> list | None:
        """Get cached search results."""
        key = self.make_search_key(query, mode, filters)
        return await self.get(key)


class MLCache(CacheService):
    """Specialized cache для ML predictions."""

    def __init__(self):
        super().__init__(namespace="ml")

    async def cache_prediction(self, model_id: str, input_data: Any, prediction: Any, ttl: int = TTL_LONG):
        """Cache ML prediction."""
        input_hash = self._hash_key(input_data)
        key = f"{model_id}:{input_hash}"
        await self.set(key, prediction, ttl)

    async def get_cached_prediction(self, model_id: str, input_data: Any) -> Any | None:
        """Get cached prediction."""
        input_hash = self._hash_key(input_data)
        key = f"{model_id}:{input_hash}"
        return await self.get(key)


# ═══════════════════════════════════════════════════════════════════════════
# GLOBAL INSTANCES
# ═══════════════════════════════════════════════════════════════════════════

# Global cache instances
_cache_service: CacheService | None = None
_search_cache: SearchCache | None = None
_ml_cache: MLCache | None = None


def get_cache() -> CacheService:
    """Get global cache service instance."""
    global _cache_service
    if _cache_service is None:
        _cache_service = CacheService()
    return _cache_service


def get_search_cache() -> SearchCache:
    """Get search cache instance."""
    global _search_cache
    if _search_cache is None:
        _search_cache = SearchCache()
    return _search_cache


def get_ml_cache() -> MLCache:
    """Get ML cache instance."""
    global _ml_cache
    if _ml_cache is None:
        _ml_cache = MLCache()
    return _ml_cache
