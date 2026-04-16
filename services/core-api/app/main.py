from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from datetime import UTC, datetime

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from starlette.responses import Response

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
    dashboard_router,
    declarations_router,
    factory_router,
    graph_router,
    ingestion_router,
    intelligence_router,
    maritime_router,
    ml_studio_router,
    newspaper_router,
    optimizer_router,
    osint_router,
    osint_ua_router,
    persons_router,
    premium_router,
    public_api_router,
    registries_router,
    registries_ui_router,
    risk_router,
    search_router,
    som_router,
    stats_router,
    system_router,
    warroom_router,
)
from app.services.factory_repository import FactoryRepository
from app.services.factory_runtime import (
    cancel_factory_improvement_task,
    ensure_factory_improvement_task,
)
from app.services.kafka_service import close_kafka, init_kafka
from app.services.minio_service import close_minio, init_minio
from app.services.redis_service import close_redis, init_redis
from app.services.guardian import guardian_service
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
    app.state.started_at = datetime.now(UTC)

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
        try:
            init_db()
        except Exception as e:
            logger.warning(f"PostgreSQL connection failed: {e}. Running in degraded mode.")

        # 2. Init Graph Driver
        try:
            graph_db.init_driver()
        except Exception as e:
            logger.warning(f"Neo4j driver init failed: {e}")

        # 3. Init Kafka Producer (§2.4)
        try:
            await init_kafka()
        except Exception as e:
            logger.warning(f"Kafka connection failed: {e}. Service will be limited.")

        # 4. Init MinIO/S3 (§2.5)
        try:
            await init_minio()
        except Exception as e:
            logger.warning(f"MinIO connection failed: {e}")

        # 5. Init Redis (§2.6)
        try:
            await init_redis()
        except Exception as e:
            logger.warning(f"Redis connection failed: {e}")

        # 6. Init Factory Repository
        try:
            app.state.factory_repo = FactoryRepository(graph_db.driver)
            from app.routers.factory import _run_ooda_task

            app.state.factory_improvement_runner = _run_ooda_task
            app.state.factory_improvement_task = None
            logger.info("Factory Repository initialized")

            await ensure_factory_improvement_task(app)
        except Exception as e:
            logger.warning(f"Factory OODA initialization failed: {e}. System Factory features will be unavailable.")

        # 7. Start Sovereign Guardian (Auto-Healing)
        app.state.guardian_task = asyncio.create_task(guardian_service.run_loop())
        logger.info("Sovereign Guardian task started")

        logger.info("Core API ініціалізовано (можливо, в обмеженому режимі)")

    yield

    logger.info("Зупинка Core API...")
    # Graceful shutdown
    if not settings.TESTING:
        guardian_service.stop()
        if hasattr(app.state, 'guardian_task'):
            app.state.guardian_task.cancel()
        await cancel_factory_improvement_task(app)
        await close_redis()
        await close_kafka()
        await close_minio()
        await close_db()
        await graph_db.close()

    logger.info("Core API зупинено.")


app = FastAPI(
    title=get_settings().APP_NAME,
    version="56.5-ELITE",
    description="Аналітична платформа PREDATOR Analytics (v56.5-ELITE)",
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
    ("/api/v1", dashboard_router),
    ("/api/v1", declarations_router),
    ("/api/v1", factory_router),
    ("/api/v1", graph_router),
    ("/api/v1", ingestion_router),
    ("/api/v1", intelligence_router),
    ("/api/v1", maritime_router),
    ("/api/v1", newspaper_router),
    ("/api/v1", optimizer_router),
    ("/api/v1", osint_router),
    ("/api/v1", osint_ua_router),
    ("/api/v1", persons_router),
    ("/api/v1", premium_router),
    ("/api/v1", public_api_router),
    ("/api/v1", registries_router),
    ("/api/v1", registries_ui_router),
    ("/api/v1", risk_router),
    ("/api/v1", search_router),
    ("/api/v1", som_router),
    ("/api/v1", warroom_router),
    ("/api/v1", ml_studio_router),
    ("/api/v1", system_router),
    ("/api/v1", stats_router),
]

for prefix, router in ROUTERS:
    app.include_router(router, prefix=prefix)
    logger.debug(f"Registered router: {prefix}{router.prefix}")

@app.get("/api/v1/health", tags=["system"])
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


@app.get("/api/v1/health/ready", tags=["system"])
@app.get("/health/ready", tags=["system"])
async def readiness_check() -> JSONResponse:
    """Readiness probe - перевіряє готовність до прийому трафіку."""
    import asyncpg

    from app.config import get_settings
    from app.core.health import health_service

    try:
        # Пряма перевірка PostgreSQL з правильним DSN
        settings = get_settings()
        dsn = settings.DATABASE_URL or ""
        # Конвертуємо postgresql+asyncpg:// в postgres:// для прямого підключення
        dsn = dsn.replace("postgresql+asyncpg://", "postgres://")
        dsn = dsn.replace("postgresql://", "postgres://")

        postgres_ok = False
        try:
            conn = await asyncpg.connect(dsn=dsn, command_timeout=3.0)
            await conn.fetchval("SELECT 1")
            await conn.close()
            postgres_ok = True
        except Exception:
            pass

        # Перевірка Redis
        redis_status = await health_service.check_redis()
        redis_ok = redis_status.get("status") == "ok"

        if postgres_ok and redis_ok:
            return JSONResponse({
                "status": "ready",
                "timestamp": datetime.now(UTC).isoformat(),
                "checks": {
                    "postgresql": "ok" if postgres_ok else "error",
                    "redis": "ok" if redis_ok else "error",
                }
            })
        else:
            return JSONResponse({
                "status": "not_ready",
                "timestamp": datetime.now(UTC).isoformat(),
                "checks": {
                    "postgresql": "ok" if postgres_ok else "error",
                    "redis": "ok" if redis_ok else "error",
                }
            }, status_code=503)

    except Exception as e:
        return JSONResponse({
            "status": "not_ready",
            "timestamp": datetime.now(UTC).isoformat(),
            "error": str(e),
        }, status_code=503)


@app.get("/api/v1/health/live", tags=["system"])
@app.get("/health/live", tags=["system"])
async def liveness_check() -> JSONResponse:
    """Liveness probe - перевіряє, чи додаток живий."""
    return JSONResponse({
        "status": "alive",
        "timestamp": datetime.now(UTC).isoformat(),
        "version": get_settings().APP_VERSION,
    })


@app.get("/metrics", tags=["system"])
async def metrics() -> Response:
    """Експозиція Prometheus метрик (§2.7)."""
    from prometheus_client import CONTENT_TYPE_LATEST, generate_latest

    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)
