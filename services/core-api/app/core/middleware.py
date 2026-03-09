"""
Системні Middleware — PREDATOR Analytics v55.1 Ironclad.

Tenant isolation, логування, WORM audit trails (SecR-09).
"""
import time
import uuid
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from predator_common.logging import get_logger

logger = get_logger("core_api.middleware")

class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Generate or use correlation ID
        correlation_id = request.headers.get("X-Correlation-ID") or str(uuid.uuid4())
        
        # Add to state to use within route
        request.state.correlation_id = correlation_id
        
        # Start timing
        start_time = time.time()
        
        try:
            response = await call_next(request)
            
            # Log metrics
            process_time = (time.time() - start_time) * 1000
            
            # TODO: Emit to Prometheus if route is tracked
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


class TenantContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Встановлює Tenant контекст для RLS."""
        tenant_id = request.headers.get("X-Tenant-ID") or "global-system"
        request.state.tenant_id = tenant_id
        
        response = await call_next(request)
        return response
