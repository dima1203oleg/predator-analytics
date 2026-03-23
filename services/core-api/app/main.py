from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from datetime import UTC, datetime
from typing import Any

from fastapi import FastAPI
from fastapi.responses import JSONResponse

from app.config import get_settings

# Services
from app.core.cors import add_cors_middleware
from app.core.graph import graph_db

# Middlewares
from app.core.middleware import RequestIDMiddleware, TenantContextMiddleware
from app.core.middleware_optimization import (
    CompressionMiddleware,
    PerformanceMiddleware,
    RateLimitMiddleware,
    SecurityHeadersMiddleware,
)
from app.database import close_db, init_db

# Імпортуємо всі роутери через __init__.py
from app.routers import (
    alerts_router,
    analytics_router,
    auth_router,
    cases_router,
    companies_router,
    competitors_router,
    copilot_router,
    declarations_router,
    factory_router,
    graph_router,
    ingestion_router,
    intelligence_router,
    maritime_router,
    optimizer_router,
    osint_router,
    osint_ua_router,
    persons_router,
    public_api_router,
    registries_router,
    risk_router,
    search_router,
    som_router,
    warroom_router,
    ml_studio_router,
    system_router,
)
from app.services.factory_repository import FactoryRepository
from app.services.kafka_service import close_kafka, init_kafka
from app.services.minio_service import close_minio, init_minio
from app.services.redis_service import close_redis, init_redis
from predator_common.logging import get_logger

logger = get_logger("core_api.main")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Управління життєвим циклом FastAPI (Lifespan).
    Ініціалізація інфраструктури згідно FR-009 / OpR-31.
    """
    settings = get_settings()
    logger.info(
        "Ініціалізація Core API...",
        extra={"version": settings.APP_VERSION, "env": settings.ENV},
    )

    # Перевірка безпеки при старті
    from app.core.security import validate_security_on_startup
    try:
        security_check = validate_security_on_startup()
        if not security_check["secure"]:
            logger.error("Critical security issues detected!")
    except Exception as e:
        logger.error(f"Security validation failed: {e}")
        if settings.ENV == "production":
            raise

    if settings.TESTING:
        logger.info("TESTING режим: пропускаємо підключення зовнішніх сервісів")
    else:
        # 1. Init DB connections
        init_db()

        # 2. Init Graph Driver
        graph_db.init_driver()

        # 3. Init Kafka Producer (§2.4)
        await init_kafka()

        # 4. Init MinIO/S3 (§2.5)
        await init_minio()

        # 5. Init Redis (§2.6)
        await init_redis()

        # 6. Init Factory Repository
        app.state.factory_repo = FactoryRepository(graph_db.driver)
        logger.info("Factory Repository initialized")

        logger.info("Core API успішно ініціалізовано")

    yield

    logger.info("Зупинка Core API...")
    # Graceful shutdown
    if not settings.TESTING:
        await close_redis()
        await close_kafka()
        await close_minio()
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

# Middlewares - оптимізовано для продуктивності
app.add_middleware(CompressionMiddleware, minimum_size=1024)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(PerformanceMiddleware)
app.add_middleware(RateLimitMiddleware, rate_limiter_key="api")
app.add_middleware(RequestIDMiddleware)
app.add_middleware(TenantContextMiddleware)

# CORS middleware
cors_origins = add_cors_middleware(app)
logger.info(f"CORS enabled for origins: {cors_origins}")

# Інструментація OpenTelemetry (TR-03)
# FastAPIInstrumentor().instrument_app(app)


# Register Routers - оптимізовано для читабельності
ROUTERS = [
    ("/api/v1", alerts_router),
    ("/api/v1", analytics_router),
    ("/api/v1", auth_router),
    ("/api/v1", cases_router),
    ("/api/v1", companies_router),
    ("/api/v1", competitors_router),
    ("/api/v1", copilot_router),
    ("/api/v1", declarations_router),
    ("/api/v1", factory_router),
    ("/api/v1", graph_router),
    ("/api/v1", ingestion_router),
    ("/api/v1", intelligence_router),
    ("/api/v1", maritime_router),
    ("/api/v1", optimizer_router),
    ("/api/v1", osint_router),
    ("/api/v1", persons_router),
    ("/api/v1", public_api_router),
    ("/api/v1", registries_router),
    ("/api/v1", risk_router),
    ("/api/v1", search_router),
    ("/api/v1", som_router),
    ("/api/v1", warroom_router),
    ("/api/v1", osint_ua_router),
    ("/api/v1", ml_studio_router),
    ("/api/v1", system_router),
]

for prefix, router in ROUTERS:
    app.include_router(router, prefix=prefix)
    logger.debug(f"Registered router: {prefix}{router.prefix}")

@app.get("/health", tags=["system"])
async def health_check() -> JSONResponse:
    """Комплексний health check для K8s probes."""
    from app.core.health import health_service

    try:
        settings = get_settings()
        if settings.TESTING:
            return JSONResponse({
                "status": "ok",
                "timestamp": datetime.now(UTC).isoformat(),
                "version": settings.APP_VERSION,
                "mode": "testing"
            })
        health_status = await health_service.comprehensive_health_check()
        return JSONResponse(health_status)
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse({
            "status": "error",
            "timestamp": datetime.now(UTC).isoformat(),
            "error": str(e),
        }, status_code=503)


@app.get("/health/ready", tags=["system"])
async def readiness_check() -> JSONResponse:
    """Readiness probe - перевіряє готовність до прийому трафіку."""
    from app.core.health import health_service

    try:
        # Швидка перевірка critical сервісів
        postgres_status = await health_service.check_postgresql()
        redis_status = await health_service.check_redis()

        if postgres_status["status"] == "ok" and redis_status["status"] == "ok":
            return JSONResponse({
                "status": "ready",
                "timestamp": datetime.now(UTC).isoformat(),
                "checks": {
                    "postgresql": postgres_status["status"],
                    "redis": redis_status["status"],
                }
            })
        else:
            return JSONResponse({
                "status": "not_ready",
                "timestamp": datetime.now(UTC).isoformat(),
                "checks": {
                    "postgresql": postgres_status["status"],
                    "redis": redis_status["status"],
                }
            }, status_code=503)

    except Exception as e:
        return JSONResponse({
            "status": "not_ready",
            "timestamp": datetime.now(UTC).isoformat(),
            "error": str(e),
        }, status_code=503)


@app.get("/health/live", tags=["system"])
async def liveness_check() -> JSONResponse:
    """Liveness probe - перевіряє, чи додаток живий."""
    return JSONResponse({
        "status": "alive",
        "timestamp": datetime.now(UTC).isoformat(),
        "version": get_settings().APP_VERSION,
    })


@app.get("/metrics", tags=["system"])
async def metrics() -> Any:
    """Експозиція Prometheus метрик (§2.7)."""
    from prometheus_client import CONTENT_TYPE_LATEST, generate_latest
    from starlette.responses import Response

    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)
