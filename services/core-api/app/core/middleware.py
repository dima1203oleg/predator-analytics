"""Системні Middleware — PREDATOR Analytics v55.2-SM-EXTENDED.

Tenant isolation, логування, Prometheus metrics, WORM audit trails (SecR-09).
Реалізація згідно TZ §2.7, §2.9.
"""
from collections.abc import Callable
import time
import uuid

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.metrics import api_request_duration_seconds, api_requests_total
from predator_common.logging import get_logger

logger = get_logger("core_api.middleware")


class RequestIDMiddleware(BaseHTTPMiddleware):
    """Middleware для Request ID та Prometheus метрик."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Generate or use correlation ID
        correlation_id = request.headers.get("X-Correlation-ID") or str(uuid.uuid4())

        # Add to state to use within route
        request.state.correlation_id = correlation_id

        # Start timing
        start_time = time.time()
        status_label = "success"

        try:
            response = await call_next(request)

            # Log metrics
            process_time = (time.time() - start_time) * 1000
            status_label = "success" if response.status_code < 400 else "error"

            logger.info(
                f"Completed request {request.method} {request.url.path} in {process_time:.2f}ms",
                extra={
                    "correlation_id": correlation_id,
                    "method": request.method,
                    "path": request.url.path,
                    "process_time_ms": round(process_time, 2),
                    "status_code": response.status_code,
                }
            )

            # Inject Header Back
            response.headers["X-Correlation-ID"] = correlation_id
            response.headers["X-Process-Time"] = f"{process_time:.2f}ms"

            return response

        except Exception as exc:
            process_time = (time.time() - start_time) * 1000
            status_label = "error"
            logger.error(
                f"Failed request {request.method} {request.url.path} in {process_time:.2f}ms",
                extra={
                    "correlation_id": correlation_id,
                    "method": request.method,
                    "path": request.url.path,
                    "process_time_ms": round(process_time, 2),
                    "error": str(exc),
                },
                exc_info=True
            )
            raise

        finally:
            # Prometheus metrics (§2.7.2)
            duration_seconds = (time.time() - start_time)
            endpoint = self._normalize_endpoint(request.url.path)

            api_requests_total.labels(
                method=request.method,
                endpoint=endpoint,
                status=status_label
            ).inc()

            api_request_duration_seconds.labels(
                method=request.method,
                endpoint=endpoint
            ).observe(duration_seconds)

    def _normalize_endpoint(self, path: str) -> str:
        """Нормалізує endpoint для метрик (замінює UUID на placeholder)."""
        import re
        # Замінюємо UUID на {id}
        normalized = re.sub(
            r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}",
            "{id}",
            path,
            flags=re.IGNORECASE
        )
        # Замінюємо числові ID на {id}
        normalized = re.sub(r"/\d+(/|$)", r"/{id}\1", normalized)
        return normalized


class TenantContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Встановлює Tenant контекст для RLS."""
        tenant_id = request.headers.get("X-Tenant-ID") or "global-system"
        request.state.tenant_id = tenant_id

        response = await call_next(request)
        return response
