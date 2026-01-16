"""
Middleware for Predator Analytics
- Rate Limiting
- Request Logging
- Prometheus Metrics
- Error Handling
"""
import time
import os
import uuid
from typing import Callable, Optional
from fastapi import Request, Response, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import redis.asyncio as aioredis
import psutil
from prometheus_client import Counter, Histogram, Gauge, REGISTRY
from datetime import datetime
from libs.core.structured_logger import get_logger, RequestLogger

logger = get_logger("predator.middleware")

# Стан Circuit Breaker (глобальний для інстансу)
CIRCUIT_STATE = {
    "open_circuits": {}, # {service_name: timestamp_of_failure}
    "failure_counters": {} # {service_name: count}
}

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

        # Dynamic Rate Limiting based on system load (v26.3)
        cpu_usage = psutil.cpu_percent()
        effective_limit = self.limiter.requests_per_minute

        if cpu_usage > 85:
            # Critical load: reduce limits by 80%
            effective_limit = max(5, int(self.limiter.requests_per_minute * 0.2))
            logger.warning("system_overload_detected", cpu_usage=cpu_usage, throttling=True)
        elif cpu_usage > 60:
            # Medium load: reduce limits by 50%
            effective_limit = int(self.limiter.requests_per_minute * 0.5)

        if is_internal or request.url.path in ["/metrics", "/health", "/api/v1/health"]:
             return await call_next(request)

        allowed, retry_after = await self.limiter.is_allowed(client_ip)
        if not allowed:
             RATE_LIMIT_EXCEEDED.labels(client_ip=client_ip).inc()
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

        return response

class CircuitBreakerMiddleware(BaseHTTPMiddleware):
    """
    Middleware для запобігання каскадним збоям (Circuit Breaker).
    Якщо сервіс (напр. /search) видає багато помилок, він 'замикається' на 60 сек.
    """
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        from libs.core.config import settings

        path = request.url.path
        service_id = path.split('/')[2] if len(path.split('/')) > 2 else "root"

        now = time.time()

        # Перевірка чи ланцюг розімкнутий
        if service_id in CIRCUIT_STATE["open_circuits"]:
            if now - CIRCUIT_STATE["open_circuits"][service_id] < 60:
                logger.warning(f"🔌 CIRCUIT OPEN for {service_id}. Returning survival response.")
                return JSONResponse(
                    status_code=503,
                    content={
                        "error": "Service in Survival Mode",
                        "status": "DEGRADED",
                        "context": "Система захищає ядро. Будь ласка, спробуйте через хвилину."
                    }
                )
            else:
                # Час вийшов, пробуємо знову (half-open)
                del CIRCUIT_STATE["open_circuits"][service_id]
                CIRCUIT_STATE["failure_counters"][service_id] = 0

        try:
            response = await call_next(request)

            if response.status_code >= 500:
                self._record_failure(service_id, settings.CIRCUIT_BREAKER_THRESHOLD)

            return response
        except Exception as e:
            self._record_failure(service_id, settings.CIRCUIT_BREAKER_THRESHOLD)
            raise e

    def _record_failure(self, service_id: str, threshold: int):
        count = CIRCUIT_STATE["failure_counters"].get(service_id, 0) + 1
        CIRCUIT_STATE["failure_counters"][service_id] = count

        if count >= threshold:
            CIRCUIT_STATE["open_circuits"][service_id] = time.time()
            logger.error(f"💥 CIRCUIT BLOWN for {service_id}! Transitioning to SURVIVAL MODE.")

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Get path for context
        path = request.url.path
        method = request.method

        # Use RequestLogger for structured timing and logging
        with RequestLogger(logger, "http_request", path=path, method=method) as req_logger:
            try:
                response = await call_next(request)

                # Add Correlation ID to response headers if available
                if hasattr(request.state, "correlation_id"):
                    response.headers["X-Correlation-ID"] = request.state.correlation_id

                # Update context for the completion log
                req_logger.bind(status_code=response.status_code)

                return response
            except Exception as e:
                # Exception is handled by RequestLogger.__exit__
                raise e

class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        try:
            return await call_next(request)
        except Exception as e:
            # Використовуємо ШІ-аналіз помилок (UA/Free API)
            try:
                from libs.core.structured_logger import log_error_with_analysis
                log_error_with_analysis(logger, e, {"path": request.url.path, "method": request.method})
            except:
                logger.exception("exception_analysis_failed")

            return JSONResponse(
                status_code=500,
                content={
                    "error": "Внутрішня помилка сервера",
                    "detail": str(e),
                    "context": "ШІ-аналіз помилки додано до логів"
                }
            )
