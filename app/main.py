import asyncio
from contextlib import asynccontextmanager
from datetime import UTC, datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.canonical_router import api_v1_router
from app.core.settings import get_settings
from app.libs.core.mq import broker
from app.libs.core.otel import setup_otel
from app.libs.core.structured_logger import get_logger

# Autonomous AI Orchestration (v4.1)
from libs.core.autonomy.orchestrator import orchestrator
from app.libs.core.autonomy.pulse_agent import SystemPulseAgent

settings = get_settings()
logger = get_logger("predator.api.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Канонічний lifespan context manager PREDATOR Analytics v4.1.
    Замінює застарілі on_event('startup') та on_event('shutdown').
    """
    logger.info("PREDATOR_BOOT_START", mode="CANONICAL", version=settings.APP_VERSION)

    # 1. Ініціалізація БД та схем
    try:
        from sqlalchemy import text as sa_text
        from app.core.database import engine as db_engine

        async with db_engine.begin() as conn:
            await conn.execute(sa_text("CREATE SCHEMA IF NOT EXISTS v1"))
            await conn.execute(sa_text("CREATE EXTENSION IF NOT EXISTS pg_trgm"))
            logger.info("✅ Database schema initialized")
    except Exception as e:
        logger.warning(f"Database init skipped or failed: {e}")

    # 2. Сервісна шина (Signal Bus)
    try:
        from app.core.signal_bus import signal_bus
        await signal_bus.connect()
        app.state.signal_bus = signal_bus
        logger.info("✅ Signal Bus connected")
    except Exception as e:
        logger.warning(f"Signal Bus init skipped: {e}")

    # 3. Message Broker (Celery/Redis)
    try:
        await asyncio.wait_for(broker.connect(), timeout=5.0)
        logger.info("✅ Event Bus connected")
    except Exception:
        logger.warning("Event Bus connection failed")

    # 4. Автономні агенти (Sovereign Agents)
    try:
        pulse_agent = SystemPulseAgent(api_base_url="http://localhost:8000")
        orchestrator.register_agent(pulse_agent)
        await orchestrator.start()
        app.state.agents = orchestrator
        logger.info("✅ Sovereign Agents (v4.1) initialized")
    except Exception as e:
        logger.exception(f"Sovereign Agents failed to start: {e}")

    yield  # Застосунок запущено

    # ── SHUTDOWN ──
    logger.info("PREDATOR_SHUTDOWN_INIT")
    await orchestrator.stop()
    await broker.disconnect()
    
    try:
        await signal_bus.disconnect()
    except Exception:
        pass
        
    logger.info("PREDATOR_SHUTDOWN_COMPLETE")


app = FastAPI(
    title="Predator Analytics v4.1",
    description="Економічний радар: система раннього попередження та OSINT аналітики",
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

# Initialize OpenTelemetry
setup_otel(app, "predator_backend")

# Middleware Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# API ROUTER INCLUSION (Canonical v4.1)
# ============================================================================

app.include_router(api_v1_router)

# Legacy / v45 health check (for monitoring compatibility)
@app.get("/api/v45/health")
async def legacy_health():
    return {"status": "HEALTHY", "version": settings.APP_VERSION}


@app.get("/")
async def root():
    return {
        "system": "PREDATOR",
        "version": settings.APP_VERSION,
        "status": "OPERATIONAL",
        "autonomy_level": "SOVEREIGN",
        "timestamp": datetime.now(UTC).isoformat(),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
