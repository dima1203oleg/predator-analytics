"""module: canonical_router
Core API роутер для нових мікросервісів."""

from fastapi import APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi import HTTPException
from prometheus_fastapi_instrumentator import Instrumentator

# Імпорти внутрішніх роутерів
from app.routers import (
    forecast_router,
    auth_router,
    risk_router,
    search_router,
    persons_router as users_router,
)
from app.api.v1.adv_dvs import router as adv_dvs_router
from app.api.v1.endpoints import agents_control, llm, claw_code, avatar_stream, osint

router = APIRouter()

@router.get("/health")
async def health_check():
    """Базовий healthcheck Core API."""
    return {"status": "healthy", "service": "core-api"}

# Підключення внутрішніх сервісів
router.include_router(auth_router, prefix="/v1/auth", tags=["auth"])
router.include_router(users_router, prefix="/v1/users", tags=["users"])
router.include_router(risk_router, prefix="/v1/risk", tags=["risk"])
router.include_router(search_router, prefix="/v1/search", tags=["search"])
router.include_router(adv_dvs_router, prefix="/v1/adv-dvs", tags=["adv-dvs"])
# Підключення LLM Router
router.include_router(
    llm.router,
    prefix="/v1/llm",
    tags=["llm"]
)

# Підключення Avatar Stream WebSocket
router.include_router(
    avatar_stream.router,
    prefix="/v1/copilot/avatar",
    tags=["copilot", "avatar"]
)

# Підключення Claw Code (Автономний Рефакторинг)
router.include_router(
    claw_code.router,
    prefix="/v1/claw-code",
    tags=["claw-code"]
)

# Підключення Forecast Router
router.include_router(
    forecast_router,
    prefix="/v1", # it already has /forecast in its prefix
)

# Підключення OSINT Router
router.include_router(
    osint.router,
    prefix="/v1/osint",
    tags=["osint"]
)

# Підключення Watchlist Router (Безперервний моніторинг)
from app.routers.watchlist import router as watchlist_router
router.include_router(
    watchlist_router,
    prefix="/v1",
    tags=["watchlist"]
)
