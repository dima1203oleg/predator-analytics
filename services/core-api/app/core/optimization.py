"""Predator Core API Optimization Module.

Оптимізації та покращення продуктивності:
- Connection pooling
- Caching strategies
- Async patterns
- Error handling
- Rate limiting
"""
import asyncio
from collections.abc import Callable
from datetime import UTC, datetime
from functools import wraps
from typing import Any, TypeVar

from predator_common.logging import get_logger

logger = get_logger("core_api.optimization")

T = TypeVar("T")


def async_cache(ttl: int = 300):
    """Provide async cache decorator with TTL."""
    cache = {}

    def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            key = str(args) + str(kwargs)
            now = datetime.now(UTC).timestamp()

            # Check cache
            if key in cache:
                value, timestamp = cache[key]
                if now - timestamp < ttl:
                    return value

            # Execute and cache
            result = await func(*args, **kwargs)
            cache[key] = (result, now)
            return result

        return wrapper
    return decorator


def retry_async(max_attempts: int = 3, delay: float = 1.0):
    """Retry decorator for async functions."""
    def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            last_exception = None

            for attempt in range(max_attempts):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    last_exception = e
                    if attempt < max_attempts - 1:
                        logger.warning(
                            f"Attempt {attempt + 1} failed for {func.__name__}: {e}",
                            extra={"attempt": attempt + 1, "max_attempts": max_attempts}
                        )
                        await asyncio.sleep(delay * (2 ** attempt))  # Exponential backoff
                    else:
                        logger.error(
                            f"All {max_attempts} attempts failed for {func.__name__}",
                            extra={"error": str(e)}
                        )

            raise last_exception
        return wrapper
    return decorator


def performance_monitor(func: Callable[..., Any]) -> Callable[..., Any]:
    """Monitor function performance."""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        start_time = datetime.now(UTC)
        try:
            result = await func(*args, **kwargs)
            duration = (datetime.now(UTC) - start_time).total_seconds()

            logger.debug(
                f"Function {func.__name__} completed",
                extra={
                    "function": func.__name__,
                    "duration_seconds": duration,
                    "success": True
                }
            )

            return result
        except Exception as e:
            duration = (datetime.now(UTC) - start_time).total_seconds()

            logger.error(
                f"Function {func.__name__} failed",
                extra={
                    "function": func.__name__,
                    "duration_seconds": duration,
                    "success": False,
                    "error": str(e)
                }
            )

            raise

    return wrapper


class ConnectionPoolManager:
    """Manager for connection pools."""

    def __init__(self) -> None:
        self.pools = {}

    def register_pool(self, name: str, pool: Any):
        """Register a connection pool."""
        self.pools[name] = pool
        logger.info(f"Registered connection pool: {name}")

    async def close_all(self):
        """Close all connection pools."""
        for name, pool in self.pools.items():
            try:
                if hasattr(pool, 'close'):
                    await pool.close()
                elif hasattr(pool, 'aclose'):
                    await pool.aclose()
                logger.info(f"Closed connection pool: {name}")
            except Exception as e:
                logger.error(f"Error closing pool {name}: {e}")


# Global pool manager instance
pool_manager = ConnectionPoolManager()


class RateLimiter:
    """Simple in-memory rate limiter."""

    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = {}

    async def is_allowed(self, key: str) -> bool:
        """Check if request is allowed for given key."""
        now = datetime.now(UTC).timestamp()

        if key not in self.requests:
            self.requests[key] = []

        # Clean old requests
        self.requests[key] = [
            req_time for req_time in self.requests[key]
            if now - req_time < self.window_seconds
        ]

        # Check limit
        if len(self.requests[key]) >= self.max_requests:
            return False

        # Add current request
        self.requests[key].append(now)
        return True


# Global rate limiters
rate_limiters = {
    "api": RateLimiter(max_requests=1000, window_seconds=60),
    "search": RateLimiter(max_requests=100, window_seconds=60),
    "analytics": RateLimiter(max_requests=50, window_seconds=60),
}
