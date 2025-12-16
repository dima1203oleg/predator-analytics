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
from prometheus_client import Counter, Histogram, Gauge
from datetime import datetime

logger = logging.getLogger(__name__)

# ═══════════════════════════════════════════════════════════════════════════
# PROMETHEUS METRICS
# ═══════════════════════════════════════════════════════════════════════════

# Request metrics
HTTP_REQUESTS_TOTAL = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

HTTP_REQUEST_DURATION = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration in seconds',
    ['method', 'endpoint'],
    buckets=[0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0]
)

HTTP_REQUEST_SIZE = Histogram(
    'http_request_size_bytes',
    'HTTP request size in bytes',
    ['method', 'endpoint']
)

HTTP_RESPONSE_SIZE = Histogram(
    'http_response_size_bytes',
    'HTTP response size in bytes',
    ['method', 'endpoint']
)

# Active connections
ACTIVE_CONNECTIONS = Gauge(
    'http_active_connections',
    'Number of active HTTP connections'
)

# Rate limiting
RATE_LIMIT_EXCEEDED = Counter(
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

    Args:
        redis_url: Redis connection URL
        requests_per_minute: Max requests per minute per IP
        requests_per_hour: Max requests per hour per IP
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
        """Get Redis connection"""
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
        """
        Check if request is allowed

        Returns:
            (is_allowed, retry_after_seconds)
        """
        redis = await self._get_redis()
        if redis is None:
            # Redis unavailable, allow request
            return True, 0

        now = int(time.time())
        minute_key = f"ratelimit:{client_ip}:minute:{now // 60}"
        hour_key = f"ratelimit:{client_ip}:hour:{now // 3600}"

        try:
            # Use pipeline for efficiency
            async with redis.pipeline() as pipe:
                pipe.incr(minute_key)
                pipe.expire(minute_key, 60)
                pipe.incr(hour_key)
                pipe.expire(hour_key, 3600)
                results = await pipe.execute()

            minute_count = results[0]
            hour_count = results[2]

            # Check limits
            if minute_count > self.requests_per_minute:
                retry_after = 60 - (now % 60)
                RATE_LIMIT_EXCEEDED.labels(client_ip=client_ip).inc()
                return False, retry_after

            if hour_count > self.requests_per_hour:
                retry_after = 3600 - (now % 3600)
                RATE_LIMIT_EXCEEDED.labels(client_ip=client_ip).inc()
                return False, retry_after

            return True, 0

        except Exception as e:
            logger.warning(f"Rate limit check error: {e}")
            return True, 0  # Allow on error

    async def get_usage(self, client_ip: str) -> dict:
        """Get current rate limit usage for client"""
        redis = await self._get_redis()
        if redis is None:
            return {"error": "Redis unavailable"}

        now = int(time.time())
        minute_key = f"ratelimit:{client_ip}:minute:{now // 60}"
        hour_key = f"ratelimit:{client_ip}:hour:{now // 3600}"

        try:
            minute_count = await redis.get(minute_key) or 0
            hour_count = await redis.get(hour_key) or 0

            return {
                "minute": {
                    "used": int(minute_count),
                    "limit": self.requests_per_minute,
                    "remaining": max(0, self.requests_per_minute - int(minute_count))
                },
                "hour": {
                    "used": int(hour_count),
                    "limit": self.requests_per_hour,
                    "remaining": max(0, self.requests_per_hour - int(hour_count))
                }
            }
        except Exception as e:
            return {"error": str(e)}


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    FastAPI middleware for rate limiting
    """

    def __init__(
        self,
        app,
        requests_per_minute: int = 60,
        requests_per_hour: int = 1000,
        exclude_paths: list = None
    ):
        super().__init__(app)
        self.limiter = RateLimiter(
            requests_per_minute=requests_per_minute,
            requests_per_hour=requests_per_hour
        )
        self.exclude_paths = exclude_paths or ["/health", "/metrics", "/docs", "/openapi.json"]

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip for excluded paths
        if request.url.path in self.exclude_paths:
            return await call_next(request)

        # Get client IP
        client_ip = self._get_client_ip(request)

        # Check rate limit
        is_allowed, retry_after = await self.limiter.is_allowed(client_ip)

        if not is_allowed:
            return JSONResponse(
                status_code=429,
                content={
                    "error": "Rate limit exceeded",
                    "retry_after": retry_after
                },
                headers={
                    "Retry-After": str(retry_after),
                    "X-RateLimit-Limit": str(self.limiter.requests_per_minute),
                    "X-RateLimit-Remaining": "0"
                }
            )

        # Add rate limit headers to response
        response = await call_next(request)

        # Get current usage for headers
        usage = await self.limiter.get_usage(client_ip)
        if "minute" in usage:
            response.headers["X-RateLimit-Limit"] = str(self.limiter.requests_per_minute)
            response.headers["X-RateLimit-Remaining"] = str(usage["minute"]["remaining"])

        return response

    def _get_client_ip(self, request: Request) -> str:
        """Get real client IP, considering proxies"""
        # Check X-Forwarded-For header
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()

        # Check X-Real-IP
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip

        # Fall back to direct connection
        return request.client.host if request.client else "unknown"


class MetricsMiddleware(BaseHTTPMiddleware):
    """
    FastAPI middleware for Prometheus metrics collection
    """

    def __init__(self, app, exclude_paths: list = None):
        super().__init__(app)
        self.exclude_paths = exclude_paths or ["/metrics"]

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip metrics endpoint
        if request.url.path in self.exclude_paths:
            return await call_next(request)

        # Track active connections
        ACTIVE_CONNECTIONS.inc()

        # Track request timing
        start_time = time.time()

        # Normalize endpoint for metrics (replace IDs with placeholders)
        endpoint = self._normalize_endpoint(request.url.path)
        method = request.method

        # Track request size
        content_length = request.headers.get("content-length")
        if content_length:
            HTTP_REQUEST_SIZE.labels(method=method, endpoint=endpoint).observe(int(content_length))

        try:
            response = await call_next(request)
            status = response.status_code
        except Exception as e:
            status = 500
            ACTIVE_CONNECTIONS.dec()
            raise

        # Calculate duration
        duration = time.time() - start_time

        # Record metrics
        HTTP_REQUESTS_TOTAL.labels(
            method=method,
            endpoint=endpoint,
            status=status
        ).inc()

        HTTP_REQUEST_DURATION.labels(
            method=method,
            endpoint=endpoint
        ).observe(duration)

        # Track response size
        response_size = response.headers.get("content-length")
        if response_size:
            HTTP_RESPONSE_SIZE.labels(method=method, endpoint=endpoint).observe(int(response_size))

        ACTIVE_CONNECTIONS.dec()

        # Add timing header
        response.headers["X-Response-Time"] = f"{duration:.3f}s"

        return response

    def _normalize_endpoint(self, path: str) -> str:
        """Normalize endpoint path for metrics (replace dynamic segments)"""
        import re

        # Replace UUIDs
        path = re.sub(
            r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}',
            '{id}',
            path
        )

        # Replace numeric IDs
        path = re.sub(r'/\d+', '/{id}', path)

        # Replace EDRPOU (8 digits)
        path = re.sub(r'/\d{8}$', '/{edrpou}', path)

        return path


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    FastAPI middleware for request/response logging
    """

    def __init__(self, app, log_body: bool = False):
        super().__init__(app)
        self.log_body = log_body

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        request_id = request.headers.get("X-Request-ID", "") or f"req_{int(time.time() * 1000)}"

        # Log request
        logger.info(
            f"→ {request.method} {request.url.path} "
            f"[{request.client.host if request.client else 'unknown'}] "
            f"Request-ID: {request_id}"
        )

        start_time = time.time()

        try:
            response = await call_next(request)
            duration = time.time() - start_time

            # Log response
            logger.info(
                f"← {request.method} {request.url.path} "
                f"[{response.status_code}] {duration:.3f}s"
            )

            # Add request ID to response
            response.headers["X-Request-ID"] = request_id

            return response

        except Exception as e:
            duration = time.time() - start_time
            logger.error(
                f"✗ {request.method} {request.url.path} "
                f"[ERROR] {duration:.3f}s - {str(e)}"
            )
            raise


class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    """
    Global error handler middleware
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        try:
            return await call_next(request)
        except HTTPException:
            raise
        except Exception as e:
            logger.exception(f"Unhandled error: {e}")
            return JSONResponse(
                status_code=500,
                content={
                    "error": "Internal server error",
                    "detail": str(e) if os.getenv("DEBUG") else "An unexpected error occurred",
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
