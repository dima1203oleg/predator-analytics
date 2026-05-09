import asyncio
from contextlib import asynccontextmanager, suppress
from datetime import UTC, datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Автономна AI Оркестрація (v61.0-ELITE)
from libs.core.autonomy.orchestrator import orchestrator
from libs.core.autonomy.pulse_agent import SystemPulseAgent

from app.api.v1.canonical_router import api_v1_router
from app.core.settings import get_settings
from app.libs.core.mq import broker
from app.libs.core.otel import setup_otel
from app.libs.core.structured_logger import get_logger

settings = get_settings()
logger = get_logger("predator.api.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Канонічний lifespan-контекст PREDATOR Analytics v61.0-ELITE.
    Забезпечує безпечний запуск та зупинку всіх критичних сервісів.
    """
    logger.info("🚀 PREDATOR_BOOT_START", mode="CANONICAL", version=settings.APP_VERSION)

    # 1. Ініціалізація бази даних та схем (PostgreSQL SSOT)
    try:
        from sqlalchemy import text as sa_text
        from app.core.database import engine as db_engine

        async with db_engine.begin() as conn:
            await conn.execute(sa_text("CREATE SCHEMA IF NOT EXISTS v1"))
            await conn.execute(sa_text("CREATE EXTENSION IF NOT EXISTS pg_trgm"))
            logger.info("✅ База даних: схему v1 ініціалізовано")
    except Exception as e:
        logger.warning(f"⚠️ Помилка ініціалізації БД: {e}")

    # 2. Сервісна шина сигналів (Signal Bus)
    try:
        from app.core.signal_bus import signal_bus
        await signal_bus.connect()
        app.state.signal_bus = signal_bus
        logger.info("✅ Signal Bus: підключено")
    except Exception as e:
        logger.warning(f"⚠️ Signal Bus: не вдалося підключитися: {e}")

    # 3. Брокер повідомлень (Event Bus / Redis)
    try:
        await asyncio.wait_for(broker.connect(), timeout=5.0)
        logger.info("✅ Event Bus: підключено")
    except Exception:
        logger.warning("⚠️ Event Bus: підключення не вдалося (timeout)")

    # 4. Автономні агенти (Sovereign AI Stack)
    try:
        # Ініціалізація системного агента пульсу для моніторингу OODA-циклу
        pulse_agent = SystemPulseAgent(api_base_url="http://localhost:8000")
        orchestrator.register_agent(pulse_agent)
        await orchestrator.start()
        app.state.agents = orchestrator
        logger.info("✅ Sovereign Agents (v61.0-ELITE): активовано")
    except Exception as e:
        logger.exception(f"❌ Критична помилка запуску Sovereign Agents: {e}")

    yield  # 🛰️ СИСТЕМА В ОНЛАЙНІ

    # ── SHUTDOWN (Граціозне завершення) ──
    logger.info("⏳ PREDATOR_SHUTDOWN_INIT: деактивація протоколів...")
    
    await orchestrator.stop()
    await broker.disconnect()

    with suppress(Exception):
        await signal_bus.disconnect()

    logger.info("🏁 PREDATOR_SHUTDOWN_COMPLETE: систему вимкнено безпечно")


app = FastAPI(
    title="PREDATOR Analytics v61.0-ELITE",
    description="Суверенна OSINT-платформа для митної аналітики та виявлення ризиків",
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

# Налаштування OpenTelemetry для моніторингу продуктивності
setup_otel(app, "predator_backend_elite")

# Конфігурація CORS (HR-04)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ═══════════════════════════════════════════════════════════════════════════
# ПІДКЛЮЧЕННЯ РОУТЕРІВ (Canonical v61.0)
# ═══════════════════════════════════════════════════════════════════════════

app.include_router(api_v1_router)

# Перевірка здоров'я для систем моніторингу (Prometheus/K8s)
@app.get("/api/v1/health/live")
async def health_check():
    return {
        "status": "OPERATIONAL",
        "version": settings.APP_VERSION,
        "mode": "ELITE",
        "timestamp": datetime.now(UTC).isoformat()
    }

@app.get("/")
async def root():
    """Точка входу API для перевірки статусу системи."""
    return {
        "system": "PREDATOR",
        "node": "SOVEREIGN",
        "version": settings.APP_VERSION,
        "status": "READY",
        "autonomy": "ELITE_LEVEL_5",
        "timestamp": datetime.now(UTC).isoformat(),
    }


if __name__ == "__main__":
    import uvicorn
    # Запуск у режимі розробки
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
