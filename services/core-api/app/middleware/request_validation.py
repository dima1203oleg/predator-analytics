"""🛡️ Advanced Request Validation Middleware для PREDATOR Analytics v56.1.4

Валідація вхідних запитів, rate limiting per tenant, та security checks.
"""

from collections import defaultdict
import time

from fastapi import HTTPException, Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from predator_common.logging import get_logger

logger = get_logger("middleware.request_validation")


class RequestValidationMiddleware(BaseHTTPMiddleware):
    """Middleware для валідації всіх вхідних запитів."""

    def __init__(
        self,
        app,
        max_body_size: int = 10 * 1024 * 1024,  # 10MB
        allowed_content_types: list[str] | None = None,
    ):
        super().__init__(app)
        self.max_body_size = max_body_size
        self.allowed_content_types = allowed_content_types or [
            "application/json",
            "multipart/form-data",
            "application/x-www-form-urlencoded",
        ]

    async def dispatch(self, request: Request, call_next):
        """Validate incoming requests before processing."""
        start_time = time.time()

        # 1. Validate Content-Type for POST/PUT/PATCH
        if request.method in ["POST", "PUT", "PATCH"]:
            content_type = request.headers.get("content-type", "")

            # Skip validation for file uploads
            if "multipart" not in content_type.lower():
                if not any(
                    allowed in content_type.lower()
                    for allowed in self.allowed_content_types
                ):
                    logger.warning(
                        f"Invalid content type: {content_type}",
                        extra={"method": request.method, "path": request.url.path}
                    )
                    raise HTTPException(
                        status_code=415,
                        detail=f"Unsupported Media Type. Allowed: {', '.join(self.allowed_content_types)}"
                    )

            # 2. Check body size
            content_length = request.headers.get("content-length")
            if content_length and int(content_length) > self.max_body_size:
                logger.warning(
                    f"Request body too large: {content_length} bytes",
                    extra={"path": request.url.path}
                )
                raise HTTPException(
                    status_code=413,
                    detail=f"Request body too large. Max: {self.max_body_size // (1024*1024)}MB"
                )

        # 3. Validate required headers
        if not self._validate_required_headers(request):
            raise HTTPException(
                status_code=400,
                detail="Missing required headers"
            )

        # 4. Sanitize path to prevent path traversal
        if ".." in request.url.path or "//" in request.url.path:
            logger.warning(
                f"Suspicious path detected: {request.url.path}",
                extra={"client_ip": request.client.host if request.client else "unknown"}
            )
            raise HTTPException(
                status_code=400,
                detail="Invalid request path"
            )

        # 5. Process request
        try:
            response = await call_next(request)

            # 6. Add security headers to response
            response = self._add_security_headers(response)

            # 7. Log request metrics
            process_time = time.time() - start_time
            logger.info(
                "Request completed",
                extra={
                    "method": request.method,
                    "path": request.url.path,
                    "status": response.status_code,
                    "duration_ms": round(process_time * 1000, 2),
                }
            )

            return response

        except HTTPException:
            raise
        except Exception as e:
            logger.error(
                f"Request processing error: {e}",
                extra={
                    "method": request.method,
                    "path": request.url.path,
                },
                exc_info=True
            )
            raise HTTPException(
                status_code=500,
                detail="Internal server error"
            )

    def _validate_required_headers(self, request: Request) -> bool:
        """Validate that required headers are present."""
        # For API endpoints, require Accept header
        if "/api/" in request.url.path:
            accept = request.headers.get("accept")
            if not accept:
                return False

        return True

    def _add_security_headers(self, response: Response) -> Response:
        """Add security headers to response."""
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate"
        response.headers["Pragma"] = "no-cache"

        return response


class TenantRateLimiter:
    """Rate limiter per tenant/user."""

    def __init__(
        self,
        default_limit: int = 100,  # requests per minute
        window_size: int = 60,  # seconds
    ):
        self.default_limit = default_limit
        self.window_size = window_size
        self.requests: dict[str, list[float]] = defaultdict(list)

    def is_allowed(self, tenant_id: str, limit: int | None = None) -> bool:
        """Check if request is allowed for tenant."""
        now = time.time()
        max_requests = limit or self.default_limit

        # Clean old requests outside window
        self.requests[tenant_id] = [
            req_time for req_time in self.requests[tenant_id]
            if now - req_time < self.window_size
        ]

        # Check if under limit
        if len(self.requests[tenant_id]) >= max_requests:
            return False

        # Record this request
        self.requests[tenant_id].append(now)
        return True

    def get_remaining(self, tenant_id: str, limit: int | None = None) -> int:
        """Get remaining requests for tenant."""
        now = time.time()
        max_requests = limit or self.default_limit

        # Clean old requests
        self.requests[tenant_id] = [
            req_time for req_time in self.requests[tenant_id]
            if now - req_time < self.window_size
        ]

        return max(0, max_requests - len(self.requests[tenant_id]))


# Global rate limiter instance
rate_limiter = TenantRateLimiter(default_limit=100, window_size=60)


async def check_rate_limit(tenant_id: str, limit: int | None = None) -> None:
    """Check rate limit for tenant.

    Raises HTTPException if rate limit exceeded.
    """
    if not rate_limiter.is_allowed(tenant_id, limit):
        remaining = rate_limiter.get_remaining(tenant_id, limit)
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Try again later.",
            headers={
                "X-RateLimit-Limit": str(limit or 100),
                "X-RateLimit-Remaining": str(remaining),
                "Retry-After": "60",
            }
        )
