from __future__ import annotations

import logging

from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint


logger = logging.getLogger("predator.security.autonomy_guard")

# Критичні шляхи, які агенти ніколи не можуть змінювати напряму
RESTRICTED_DIRECT_PATHS = [
    "/api/v1/system/config",
    "/api/v1/som/emergency",
    "/api/v1/ledger/entries",  # Леджер пишеться тільки через внутрішні сервіси, не через REST від агентів
    "/api/v1/users",
]

# Шляхи, куди агентам ДОЗВОЛЕНО писати (POST/PUT)
ALLOWED_WRITE_PATHS = [
    "/api/v1/som/proposals",  # Агенти можуть пропонувати зміни
    "/api/v1/som/analyze",  # Агенти можуть запускати аналіз
    "/api/v1/orchestrator/tasks",  # Агенти можуть створювати під-задачі
]


class AutonomyGuardMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint):
        # 1. Ідентифікація Агента
        agent_id = request.headers.get("X-Agent-ID")

        if not agent_id:
            # Це людина або внутрішній сервіс без ID агента -- пропускаємо стандартну перевірку прав
            return await call_next(request)

        method = request.method
        path = request.url.path

        # 2. Правило "Безпечного читання"
        if method in ["GET", "HEAD", "OPTIONS"]:
            return await call_next(request)

        # 3. Перевірка на заборонені дії
        logger.info(f"🛡️ AutonomyGuard: Intercepted write request from Agent {agent_id} to {method} {path}")

        # Якщо шлях у білому списку -- дозволяємо
        for allowed_path in ALLOWED_WRITE_PATHS:
            if path.startswith(allowed_path):
                return await call_next(request)

        # 4. Блокування всього іншого
        logger.warning(f"⛔ AutonomyGuard: BLOCKED Agent {agent_id} attempt to {method} {path}")

        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={
                "detail": "Autonomy Guard Violation",
                "message": "Agents are not authorized to perform direct mutations on this endpoint.",
                "solution": "Submit an Improvement Proposal (POST /api/v1/som/proposals) instead.",
                "agent_id": agent_id,
                "path": path,
            },
        )
