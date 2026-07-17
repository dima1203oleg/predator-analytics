import asyncio
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager, suppress
from datetime import UTC, datetime
import logging

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from starlette.responses import Response

from app.config import get_settings

# Middlewares
from app.core.auth_middleware import KeycloakAuthMiddleware

# Services
from app.core.cors import add_cors_middleware
from app.core.graph import graph_db
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
    admin_chaos_router,
    admin_v2_router,
    agents_router,
    ai_router,
    alerts_router,
    analytics_router,
    antigravity_router,
    auth_router,
    auto_optimizer_router,
    cases_router,
    cloud_assist_router,
    companies_router,
    competitors_router,
    copilot_router,
    dashboard_router,
    db_admin_router,
    # decisions_router,
    declarations_router,
    deepseek_tuning_router,
    factory_router,
    forecast_router,
    graph_intelligence_router,
    graph_router,
    ingestion_router,
    intelligence_router,
    maritime_router,
    market_router,
    ml_studio_router,
    neural_router,
    newspaper_router,
    omniverse_router,
    ooda_router,
    open_data_router,
    optimizer_router,
    orchestrator_router,
    osint_router,
    osint_ua_router,
    osint_vision_router,
    ownership_graph_router,
    persons_router,
    premium_router,
    public_api_router,
    rag_router,
    registries_router,
    registries_ui_router,
    risk_router,
    sanctions_router,
    search_router,
    som_router,
    stats_router,
    synthetic_data_router,
    system_router,
    telemetry_router,
    voice_router,
    voice_ws_router,
    wargaming_router,
    warroom_router,
    websocket_router,
)
from app.services.factory_repository import FactoryRepository
from app.services.factory_runtime import (
    autostart_factory_improvement_if_enabled,
    cancel_factory_improvement_task,
    ensure_factory_improvement_task,
    run_factory_watchdog_loop,
)
from app.services.guardian import guardian_service
from app.services.kafka_service import close_kafka, init_kafka
from app.services.minio_service import close_minio, init_minio
from app.services.oss_automation_scheduler import create_oss_automation_scheduler
from app.services.valkey_service import close_valkey, init_valkey
from app.services.vram_watchdog import vram_sentinel
from predator_common.logging import get_logger

logger = get_logger("core_api.main")

# Приглушити шумні логи від aiokafka (особливо connection errors коли Kafka недоступна)
logging.getLogger("aiokafka").setLevel(logging.CRITICAL)


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
            logger.error("Виявлено критичні проблеми безпеки!")
    except Exception as e:
        logger.error(f"Перевірка безпеки не вдалася: {e}")
        if settings.ENV == "production":
            raise

    if settings.TESTING:
        logger.info("TESTING режим: пропускаємо підключення зовнішніх сервісів")
    else:
        # 1. Init DB connections
        try:
            init_db()
        except Exception as e:
            logger.warning(f"Підключення до PostgreSQL не вдалося: {e}. Робота в обмеженому режимі.")

        # 2. Init Graph Driver
        try:
            graph_db.init_driver()
        except Exception as e:
            logger.warning(f"Neo4j driver init failed: {e}")

        # 3. Init Kafka Producer (§2.4)
        try:
            await init_kafka()
        except Exception as e:
            logger.warning(f"Підключення до Kafka не вдалося: {e}. Сервіс буде обмежено.")

        # 4. Init MinIO/S3 (§2.5)
        try:
            await init_minio()
        except Exception as e:
            logger.warning(f"MinIO connection failed: {e}")

        # 5. Init Valkey (§2.6)
        try:
            await init_valkey()
        except Exception as e:
            logger.warning(f"Valkey connection failed: {e}")

        # 6. Init Factory Repository
        try:
            app.state.factory_repo = FactoryRepository(graph_db.driver)
            from app.routers.factory import _run_ooda_task

            app.state.factory_improvement_runner = _run_ooda_task
            app.state.factory_improvement_task = None
            logger.info("Factory Repository initialized")

            await autostart_factory_improvement_if_enabled(
                app,
                enabled=settings.FACTORY_AUTO_START,
            )
            await ensure_factory_improvement_task(app)
        except Exception as e:
            logger.warning(f"Factory OODA initialization failed: {e}. System Factory features will be unavailable.")

        # 7. Start Resident AGIs (Antigravity Orchestrator)
        from app.services.antigravity_orchestrator import orchestrator
        await orchestrator.start(app)
        logger.info("Antigravity AGI Orchestrator started with Factory Sync")

        # Init Speech Services
        from app.services.speech import stt_service, tts_service, vad_service
        await vad_service.initialize()
        await stt_service.initialize()
        await tts_service.initialize()

        # 8. Start Sovereign Guardian (Auto-Healing)
        app.state.guardian_task = asyncio.create_task(guardian_service.run_loop())
        logger.info("Задачу Sovereign Guardian запущено (авто-відновлення)")

        # 9. Start VRAM Watchdog (FR-012)
        app.state.vram_watchdog_task = asyncio.create_task(vram_sentinel.watchdog_loop())
        logger.info("VRAM Watchdog Sentinel started")

        # 10. Сторож OODA: автономне відновлення циклу вдосконалення + синхронізація з оркестратором
        app.state.factory_watchdog_stop = asyncio.Event()
        app.state.factory_watchdog_task = None
        if (
            settings.FACTORY_WATCHDOG_ENABLED
            and getattr(app.state, "factory_repo", None) is not None
        ):
            app.state.factory_watchdog_task = asyncio.create_task(
                run_factory_watchdog_loop(
                    app,
                    settings.FACTORY_WATCHDOG_INTERVAL_SEC,
                    app.state.factory_watchdog_stop,
                )
            )
            logger.info(
                "Сторож фабрики запущено (інтервал %ss).",
                settings.FACTORY_WATCHDOG_INTERVAL_SEC,
            )

        # 11. Планувальник OSS (APScheduler): резервний ритм синхронізації оркестратора
        app.state.oss_scheduler = None
        if settings.OSS_SCHEDULER_ENABLED:
            sched = create_oss_automation_scheduler(
                app,
                settings.OSS_SCHEDULER_INTERVAL_MIN,
            )
            sched.start()
            app.state.oss_scheduler = sched
            logger.info(
                "OSS APScheduler запущено (інтервал %s хв).",
                settings.OSS_SCHEDULER_INTERVAL_MIN,
            )

        logger.info("Core API ініціалізовано (можливо, в обмеженому режимі)")

    yield

    logger.info("Зупинка Core API...")
    # Graceful shutdown
    if not settings.TESTING:
        # Stop AGI Orchestrator
        from app.services.antigravity_orchestrator import orchestrator
        orchestrator.status.is_running = False

        guardian_service.stop()
        if hasattr(app.state, 'guardian_task'):
            app.state.guardian_task.cancel()

        if hasattr(app.state, 'vram_watchdog_task'):
            app.state.vram_watchdog_task.cancel()

        if hasattr(app.state, "factory_watchdog_stop"):
            app.state.factory_watchdog_stop.set()
        wd_task = getattr(app.state, "factory_watchdog_task", None)
        if wd_task is not None:
            wd_task.cancel()
            with suppress(asyncio.CancelledError):
                await wd_task

        oss_sched = getattr(app.state, "oss_scheduler", None)
        if oss_sched is not None:
            oss_sched.shutdown(wait=False)

        await cancel_factory_improvement_task(app)
        await close_valkey()
        await close_kafka()
        await close_minio()
        await close_db()
        await graph_db.close()

    logger.info("Core API зупинено.")


app = FastAPI(
    title=get_settings().APP_NAME,
    version="63.0-ELITE",
    description="Аналітична платформа PREDATOR Analytics (v63.0-ELITE — War-gaming Horizon)",
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
app.add_middleware(KeycloakAuthMiddleware)
app.add_middleware(TenantContextMiddleware)

# CORS middleware
cors_origins = add_cors_middleware(app)
logger.info(f"CORS enabled for origins: {cors_origins}")

# Інструментація OpenTelemetry (TZ v5.0 §8 — активовано умовно)
if get_settings().ENABLE_TRACING:
    try:
        from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
        FastAPIInstrumentor().instrument_app(app)
        logger.info("OpenTelemetry tracing активовано", extra={
            "endpoint": get_settings().OTEL_EXPORTER_OTLP_ENDPOINT
        })
    except ImportError:
        logger.warning("OpenTelemetry пакети не встановлені, tracing вимкнено")
    except Exception as e:
        logger.warning(f"OpenTelemetry tracing не вдалося активувати: {e}")


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
    ("/api/v1", db_admin_router),
    ("/api/v1", declarations_router),
    ("/api/v1", factory_router),
    ("/api/v1", forecast_router),
    ("/api/v1", graph_router),
    ("/api/v1", ingestion_router),
    ("/api/v1", intelligence_router),
    ("/api/v1", maritime_router),
    ("/api/v1", omniverse_router),
    ("/api/v1", newspaper_router),
    ("/api/v1", optimizer_router),
    ("/api/v1/optimizer", auto_optimizer_router),
    ("/api/v1/deepseek_tuning", deepseek_tuning_router),

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
    ("/api/v1", synthetic_data_router),
    ("/api/v1", warroom_router),
    ("/api/v1", ml_studio_router),
    ("/api/v1", agents_router),
    ("/api/v1", antigravity_router),
    ("/api/v1", admin_chaos_router),
    ("/api/v1", graph_intelligence_router),
    ("/api/v1", system_router),
    ("/api/v1", stats_router),
    ("/api/v1", orchestrator_router),
    ("/api/v1", market_router),
    ("/api/v1", wargaming_router),
    ("/api/v1", sanctions_router),
    # ("/api/v1", decisions_router),
    ("/api/v1", cloud_assist_router),
    ("/api/v1", osint_vision_router),
    ("/api/v1", websocket_router),
    ("/api/v1", ai_router),
    ("/api/v1", neural_router),
    ("/api/v1", voice_router),
    ("/api/v1", voice_ws_router),
    ("/api/v1", rag_router),
    ("/api/v1", ooda_router),
    ("/api/v1", open_data_router),
    ("/api/v1", ownership_graph_router),
    ("/api/v2", admin_v2_router),
]

for prefix, router in ROUTERS:
    if router is not None:
        app.include_router(router, prefix=prefix)
        logger.debug(f"Registered router: {prefix}{router.prefix}")
    else:
        logger.warning(f"Skipped None router at prefix: {prefix}")

app.include_router(telemetry_router, prefix="/api/v1")

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
@app.get("/ready", tags=["system"])
async def readiness_check() -> JSONResponse:
    """Readiness probe - перевіряє готовність всього AI-стеку через Sentinel."""
    from app.services.sentinel_service import SentinelService

    try:
        report = await SentinelService.check_readiness()
        status_code = 200 if report["status"] == "ready" else 503
        return JSONResponse(report, status_code=status_code)
    except Exception as e:
        logger.error(f"Sentinel readiness check failed: {e}")
        return JSONResponse({
            "status": "not_ready",
            "timestamp": datetime.now(UTC).isoformat(),
            "message": str(e),
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
