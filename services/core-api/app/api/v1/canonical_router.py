'''module: canonical_router
'''Core API роутер для нових мікросервісів.

from fastapi import APIRouter

# Імпорти нових роутерів
from services.graph_service.app.main import app as graph_app
from services.mcp_router.app.main import app as mcp_app
# (Фіктивні роутери AI та Forecast – створяться окремо, наразі підключаємо заглушки)

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

# Підключення MCP Router (LLM) через /v1/ai
router.include_router(
    mcp_app.router,
    prefix="/v1/ai",
    tags=["ai"]
)

# TODO: додати forecast router після його реалізації
