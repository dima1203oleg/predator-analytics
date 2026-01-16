import logging
from typing import List
from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

logger = logging.getLogger("predator.som.security")

# Шляхи, які агенти можуть використовувати для запису (POST/PUT/DELETE)
# Все, що не тут, буде заблоковано для агентів, якщо це write-операція.
ALLOWED_WRITE_PATHS = [
    "/api/v1/som/proposals",     # Пропозиції
    "/api/v1/som/analyze",       # Аналіз
    "/api/v1/som/health",        # Health check (іноді агенти пінгують POST-ом, хоча це GET)
    # "/api/v1/ledger/entries"   # Прямий запис в леджер дозволено? Ні, краще через спеціальні методи. Але нехай поки буде закрито.
]

class AutonomyGuardMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint):
        # 1. Ідентифікація Агента
        agent_id = request.headers.get("X-Agent-ID")

        if not agent_id:
            return await call_next(request)

        method = request.method
        path = request.url.path

        # 2. Правило "Безпечного читання"
        if method in ["GET", "HEAD", "OPTIONS"]:
            return await call_next(request)

        # 3. Перевірка на дозволені шляхи
        logger.info(f"🛡️ SOM AutonomyGuard: Checking Agent {agent_id} request to {method} {path}")

        for allowed_path in ALLOWED_WRITE_PATHS:
            if path.startswith(allowed_path):
                 return await call_next(request)

        # 4. Блокування
        logger.warning(f"⛔ SOM AutonomyGuard: BLOCKED Agent {agent_id} attempt to {method} {path}")

        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={
                "detail": "Autonomy Guard Violation (SOM)",
                "message": "Agents cannot modify Constitutional parameters directly.",
                "solution": "Submit a proposal via POST /api/v1/som/proposals",
                "agent_id": agent_id
            }
        )
