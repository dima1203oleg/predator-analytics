"""
Middleware for Predator Analytics
- Rate Limiting
- Request Logging
- Prometheus Metrics
- Error Handling
"""
import time
import logging
from typing import Callable, Optional
from fastapi import Request, Response, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import redis.asyncio as aioredis
import os
from prometheus_client import Counter, Histogram, Gauge, REGISTRY
from datetime import datetime

logger = logging.getLogger(__name__)

# ═══════════════════════════════════════════════════════════════════════════
# PROMETHEUS METRICS
# ═══════════════════════════════════════════════════════════════════════════

def _get_or_create_metric(cls, name, *args, **kwargs):
    """Utility to avoid duplicated metrics in registry"""
    if name in REGISTRY._names_to_collectors:
        return REGISTRY._names_to_collectors[name]
    return cls(name, *args, **kwargs)

# Request metrics
HTTP_REQUESTS_TOTAL = _get_or_create_metric(
    Counter,
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

HTTP_REQUEST_DURATION = _get_or_create_metric(
    Histogram,
    'http_request_duration_seconds',
    'HTTP request duration in seconds',
    ['method', 'endpoint'],
    buckets=[0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0]
)

HTTP_REQUEST_SIZE = _get_or_create_metric(
    Histogram,
    'http_request_size_bytes',
    'HTTP request size in bytes',
    ['method', 'endpoint']
)

HTTP_RESPONSE_SIZE = _get_or_create_metric(
    Histogram,
    'http_response_size_bytes',
    'HTTP response size in bytes',
    ['method', 'endpoint']
)

# Active connections
ACTIVE_CONNECTIONS = _get_or_create_metric(
    Gauge,
    'http_active_connections',
    'Number of active HTTP connections'
)

# Rate limiting
RATE_LIMIT_EXCEEDED = _get_or_create_metric(
    Counter,
    'rate_limit_exceeded_total',
    'Number of rate limit exceeded responses',
    ['client_ip']
)


class RateLimitExceeded(HTTPException):
    """Rate limit exceeded exception"""
    def __init__(self, retry_after: int = 60):
        super().__init__(
            status_code=429,
            detail=f"Rate limit exceeded. Retry after {retry_after} seconds.",
            headers={"Retry-After": str(retry_after)}
        )


class RateLimiter:
    """
    Redis-based rate limiter with sliding window
    """
    def __init__(
        self,
        redis_url: str = None,
        requests_per_minute: int = 60,
        requests_per_hour: int = 1000
    ):
        self.redis_url = redis_url or os.getenv("REDIS_URL", "redis://localhost:6379/0")
        self.requests_per_minute = requests_per_minute
        self.requests_per_hour = requests_per_hour
        self._redis: Optional[aioredis.Redis] = None

    async def _get_redis(self) -> aioredis.Redis:
        if self._redis is None:
            try:
                self._redis = await aioredis.from_url(
                    self.redis_url,
                    encoding="utf-8",
                    decode_responses=True,
                    socket_timeout=2,
                    socket_connect_timeout=2
                )
            except Exception as e:
                logger.warning(f"Redis connection failed: {e}")
                return None
        return self._redis

    async def is_allowed(self, client_ip: str) -> tuple[bool, int]:
        redis = await self._get_redis()
        if redis is None: return True, 0
        now = int(time.time())
        minute_key = f"ratelimit:{client_ip}:minute:{now // 60}"
        hour_key = f"ratelimit:{client_ip}:hour:{now // 3600}"
        try:
            async with redis.pipeline() as pipe:
                pipe.incr(minute_key)
                pipe.expire(minute_key, 60)
                pipe.incr(hour_key)
                pipe.expire(hour_key, 3600)
                results = await pipe.execute()
            minute_count = results[0]
            hour_count = results[2]
            if minute_count > self.requests_per_minute:
                return False, 60 - (now % 60)
            if hour_count > self.requests_per_hour:
                return False, 3600 - (now % 3600)
            return True, 0
        except Exception: return True, 0

    async def get_usage(self, client_ip: str) -> dict:
        redis = await self._get_redis()
        if redis is None: return {"error": "Redis unavailable"}
        now = int(time.time())
        try:
            minute_count = await redis.get(f"ratelimit:{client_ip}:minute:{now // 60}") or 0
            return {
                "minute": {"used": int(minute_count), "limit": self.requests_per_minute},
                "hour": {"limit": self.requests_per_hour}
            }
        except Exception: return {}

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, requests_per_minute: int = 60, requests_per_hour: int = 1000):
        super().__init__(app)
        self.limiter = RateLimiter(requests_per_minute=requests_per_minute, requests_per_hour=requests_per_hour)

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        client_ip = request.client.host if request.client else "unknown"
        allowed, retry_after = await self.limiter.is_allowed(client_ip)
        if not allowed:
            return JSONResponse(status_code=429, content={"retry_after": retry_after})
        return await call_next(request)

class MetricsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        ACTIVE_CONNECTIONS.inc()
        start = time.time()
        try:
            response = await call_next(request)
            status = response.status_code
        except Exception:
            status = 500
            ACTIVE_CONNECTIONS.dec()
            raise
        latency = time.time() - start
        HTTP_REQUESTS_TOTAL.labels(method=request.method, endpoint=request.url.path, status=status).inc()
        HTTP_REQUEST_DURATION.labels(method=request.method, endpoint=request.url.path).observe(latency)
        ACTIVE_CONNECTIONS.dec()
        return response

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        logger.info(f"IN: {request.method} {request.url.path}")
        response = await call_next(request)
        logger.info(f"OUT: {request.method} {request.url.path} {response.status_code}")
        return response

class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        try:
            return await call_next(request)
        except Exception as e:
            logger.error(f"ERROR: {e}")
            return JSONResponse(status_code=500, content={"error": str(e)})
