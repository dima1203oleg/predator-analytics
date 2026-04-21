"""Optimization Middleware for Predator Core API.

Middleware для оптимізації продуктивності:
- Rate limiting
- Response compression
- Request validation caching
- Performance metrics
"""
import time
import gzip

from fastapi import HTTPException, Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import StreamingResponse
from app.services.chaos_service import ChaosService

from predator_common.logging import get_logger

from .optimization import rate_limiters

logger = get_logger("core_api.optimization_middleware")


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware."""

    def __init__(self, app, rate_limiter_key: str = "api"):
        super().__init__(app)
        self.rate_limiter = rate_limiters[rate_limiter_key]

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        # Get client identifier (IP or user ID)
        client_id = request.client.host if request.client else "unknown"

        # Check rate limit
        if not await self.rate_limiter.is_allowed(client_id):
            logger.warning(
                "Rate limit exceeded",
                extra={"client_id": client_id, "path": request.url.path}
            )
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded. Try again later."
            )

        response = await call_next(request)
        return response


class PerformanceMiddleware(BaseHTTPMiddleware):
    """Performance monitoring middleware."""

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        # Застосування хаосу (Фаза 4)
        await ChaosService.apply_chaos()

        start_time = time.time()

        response = await call_next(request)

        process_time = time.time() - start_time

        # Add performance headers
        response.headers["X-Process-Time"] = str(process_time)

        # Log performance metrics
        logger.info(
            "Request processed",
            extra={
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "process_time": process_time,
            }
        )

        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Security headers middleware."""

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        response = await call_next(request)

        # Add security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        return response


class CompressionMiddleware(BaseHTTPMiddleware):
    """Response compression middleware."""

    def __init__(self, app, minimum_size: int = 1024):
        super().__init__(app)
        self.minimum_size = minimum_size

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        response = await call_next(request)

        # Пропускаємо стрімінгові відповіді — у них відсутнє поле body
        if isinstance(response, StreamingResponse):
            return response

        # Check if response should be compressed
        body = getattr(response, "body", b"") or b""
        
        # Стискаємо лише якщо клієнт підтримує gzip, тіло досить велике і це не бінарний файл
        content_type = response.headers.get("Content-Type", "")
        is_compressible = any(t in content_type for t in ["json", "text", "javascript", "xml"])

        if (
            "gzip" in request.headers.get("accept-encoding", "")
            and is_compressible
            and isinstance(body, (bytes, bytearray))
            and len(body) > self.minimum_size
        ):
            compressed_body = gzip.compress(body)
            
            # Створюємо нову відповідь зі стиснутим тілом
            response = Response(
                content=compressed_body,
                status_code=response.status_code,
                headers=dict(response.headers)
            )
            response.headers["Content-Encoding"] = "gzip"
            response.headers["Content-Length"] = str(len(compressed_body))

        return response
