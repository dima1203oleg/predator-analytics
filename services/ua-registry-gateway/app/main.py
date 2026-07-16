"""UA Registry Gateway — головний FastAPI застосунок.

Мікросервіс для збору даних з українських публічних реєстрів:
- Prozorro (тендери)
- data.gov.ua / ЄДР (датасети)

Публікує події у Kafka KRaft: ua.prozorro.events, ua.edr.events
Розклад збору налаштовується через APScheduler (AsyncIOScheduler).
"""
import logging
import logging.config

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI
from fastapi.responses import JSONResponse

from app.collectors.datagov import collect_datagov
from app.collectors.prozorro import collect_prozorro
from app.config import get_settings
from app.services.kafka_producer import close_kafka_producer, init_kafka_producer

settings = get_settings()

logging.basicConfig(
    level=settings.LOG_LEVEL,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("ua_registry_gateway")

# ─────────────────────────────────────────
# APScheduler
# ─────────────────────────────────────────
scheduler = AsyncIOScheduler(timezone="Europe/Kyiv")

# ─────────────────────────────────────────
# FastAPI Application
# ─────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "Мікросервіс збору даних з UA реєстрів (Prozorro, data.gov.ua). "
        "Публікує події у Kafka KRaft."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
)


@app.on_event("startup")
async def on_startup() -> None:
    """Ініціалізація при старті: Kafka + планувальник задач."""
    logger.info(f"Запуск {settings.APP_NAME} v{settings.APP_VERSION}")

    # 1. Kafka producer
    await init_kafka_producer()

    # 2. Реєстрація задач APScheduler
    scheduler.add_job(
        collect_prozorro,
        trigger="interval",
        minutes=settings.PROZORRO_SCHEDULE_MINUTES,
        id="prozorro_collect",
        replace_existing=True,
        name="Збір тендерів Prozorro",
    )
    scheduler.add_job(
        collect_datagov,
        trigger="interval",
        minutes=settings.DATAGOV_SCHEDULE_MINUTES,
        id="datagov_collect",
        replace_existing=True,
        name="Збір датасетів data.gov.ua",
    )

    scheduler.start()
    logger.info(
        "APScheduler запущено",
        extra={
            "prozorro_interval_min": settings.PROZORRO_SCHEDULE_MINUTES,
            "datagov_interval_min": settings.DATAGOV_SCHEDULE_MINUTES,
        },
    )


@app.on_event("shutdown")
async def on_shutdown() -> None:
    """Коректне завершення: зупинка планувальника та Kafka."""
    logger.info("Зупинка UA Registry Gateway...")
    scheduler.shutdown(wait=False)
    await close_kafka_producer()
    logger.info("UA Registry Gateway зупинено")


# ─────────────────────────────────────────
# Ендпоінти
# ─────────────────────────────────────────

@app.get("/health", tags=["Система"])
async def health_check() -> JSONResponse:
    """Перевірка стану сервісу."""
    return JSONResponse({"status": "ok", "service": settings.APP_NAME})


@app.get("/scheduler/jobs", tags=["Планувальник"])
async def list_scheduler_jobs() -> list[dict]:
    """Список запланованих задач APScheduler."""
    jobs = []
    for job in scheduler.get_jobs():
        jobs.append({
            "id": job.id,
            "name": job.name,
            "next_run": str(job.next_run_time),
        })
    return jobs


@app.post("/collectors/prozorro/run", tags=["Колектори"])
async def run_prozorro_now() -> JSONResponse:
    """Запустити збір Prozorro негайно (поза розкладом)."""
    logger.info("Ручний запуск колектора Prozorro")
    scheduler.add_job(
        collect_prozorro,
        trigger="date",
        id="prozorro_manual",
        replace_existing=True,
        name="Prozorro (ручний запуск)",
    )
    return JSONResponse({"message": "Збір Prozorro поставлено в чергу"})


@app.post("/collectors/datagov/run", tags=["Колектори"])
async def run_datagov_now() -> JSONResponse:
    """Запустити збір data.gov.ua негайно (поза розкладом)."""
    logger.info("Ручний запуск колектора data.gov.ua")
    scheduler.add_job(
        collect_datagov,
        trigger="date",
        id="datagov_manual",
        replace_existing=True,
        name="data.gov.ua (ручний запуск)",
    )
    return JSONResponse({"message": "Збір data.gov.ua поставлено в чергу"})
