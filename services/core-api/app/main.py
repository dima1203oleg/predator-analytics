from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from predator_common.logging import get_logger

from app.config import get_settings
from app.database import init_db, close_db
from app.core.graph import graph_db

# Middlewares
from app.core.middleware import RequestIDMiddleware, TenantContextMiddleware

# Routers
from app.routers.auth import router as auth_router
from app.routers.risk import router as risk_router
from app.routers.search import router as search_router
from app.routers.companies import router as companies_router
from app.routers.persons import router as persons_router
from app.routers.declarations import router as declarations_router
from app.routers.graph import router as graph_router
from app.routers.copilot import router as copilot_router
from app.routers.warroom import router as warroom_router
from app.routers.ingestion import router as ingestion_router
from app.routers.intelligence import router as intelligence_router

logger = get_logger("core_api.main")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Управління життєвим циклом FastAPI (Lifespan).
    Ініціалізація інфраструктури згідно FR-009 / OpR-31.
    """
    settings = get_settings()
    logger.info(
        "Ініціалізація Core API...",
        extra={"version": settings.APP_VERSION, "env": settings.ENV},
    )

    # 1. Init DB connections
    init_db()
    
    # 2. Init Graph Driver
    graph_db.init_driver()

    # TODO: Init Kafka Producer / Offline Sync Queue
    # TODO: Init AOIES AgentOrchestrator

    yield

    logger.info("Зупинка Core API...")
    # Close drivers
    await close_db()
    await graph_db.close()
    
    logger.info("Core API зупинено.")


app = FastAPI(
    title=get_settings().APP_NAME,
    version="55.2-SM-EXTENDED",
    description="Аналітична платформа PREDATOR Analytics (v55.2-SM-EXTENDED)",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# Middlewares
app.add_middleware(RequestIDMiddleware)
app.add_middleware(TenantContextMiddleware)

# Інструментація OpenTelemetry (TR-03)
# FastAPIInstrumentor().instrument_app(app)


# Register Routers
app.include_router(auth_router, prefix="/api/v1")
app.include_router(risk_router, prefix="/api/v1")
app.include_router(search_router, prefix="/api/v1")
app.include_router(companies_router, prefix="/api/v1")
app.include_router(persons_router, prefix="/api/v1")
app.include_router(declarations_router, prefix="/api/v1")
app.include_router(graph_router, prefix="/api/v1")
app.include_router(copilot_router, prefix="/api/v1")
app.include_router(warroom_router, prefix="/api/v1")
app.include_router(ingestion_router, prefix="/api/v1")
app.include_router(intelligence_router, prefix="/api/v1")

@app.get("/health", tags=["system"])
async def health_check() -> JSONResponse:
    """ОК статус для K8s probes."""
    return JSONResponse({"status": "ok", "version": get_settings().APP_VERSION})


@app.get("/metrics", tags=["system"])
async def metrics() -> str:
    """Експозиція Prometheus метрик."""
    # TODO: prometheus-client integration
    return "# HELP request_count Request counter..."
