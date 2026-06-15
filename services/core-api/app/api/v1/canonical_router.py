"""module: canonical_router
Core API роутер для нових мікросервісів."""

from fastapi import APIRouter

# Імпорти нових роутерів
from services.mcp_router.app.main import app as mcp_app
from services.graph_service.app.main import app as graph_app
from app.routers.forecast import router as forecast_router
from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.risk import router as risk_router
from app.api.v1.search import router as search_router
from app.api.v1.adv_dvs import router as adv_dvs_router

router = APIRouter()

@router.get("/health")
async def health_check():
    """Базовий healthcheck Core API."""
    return {"status": "healthy", "service": "core-api"}

# Підключення Graph Service через проксі‑шлях /v1/graph
router.include_router(
    graph_app.router,
    prefix="/v1/graph",
    tags=["graph"]
)

# Підключення Auth, Users, Risk, Search, Adv-DVS
router.include_router(auth_router, prefix="/v1/auth", tags=["auth"])
router.include_router(users_router, prefix="/v1/users", tags=["users"])
router.include_router(risk_router, prefix="/v1/risk", tags=["risk"])
router.include_router(search_router, prefix="/v1/search", tags=["search"])
router.include_router(adv_dvs_router, prefix="/v1/adv-dvs", tags=["adv-dvs"])

# Підключення MCP Router (LLM) через /v1/ai
router.include_router(
    mcp_app.router,
    prefix="/v1/ai",
    tags=["ai"]
)

# Підключення LLM Router
from app.api.v1.endpoints import llm, claw_code
router.include_router(
    llm.router,
    prefix="/v1/llm",
    tags=["llm"]
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
