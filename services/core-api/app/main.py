from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from predator_common.logging import get_logger

from config import get_settings

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

    # TODO: Init DB connection pool (Postgres)
    # TODO: Init Neo4j Driver
    # TODO: Init Kafka Producer / Offline Sync Queue
    # TODO: Init AOIES AgentOrchestrator

    yield

    logger.info("Зупинка Core API...")
    # TODO: Close DBs, Kafka, Orchestrator
    logger.info("Core API зупинено.")


app = FastAPI(
    title=get_settings().APP_NAME,
    version=get_settings().APP_VERSION,
    description="Аналітична платформа PREDATOR Analytics (v55.1-Ironclad)",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# Інструментація OpenTelemetry (TR-03)
# FastAPIInstrumentor().instrument_app(app)


from app.routers.risk import router as risk_router

app.include_router(risk_router, prefix="/api/v1")

@app.get("/health", tags=["system"])
async def health_check() -> JSONResponse:
    """ОК статус для K8s probes."""
    return JSONResponse({"status": "ok", "version": get_settings().APP_VERSION})


@app.get("/metrics", tags=["system"])
async def metrics() -> str:
    """Експозиція Prometheus метрик."""
    # TODO: prometheus-client integration
    return "# HELP request_count Request counter..."
