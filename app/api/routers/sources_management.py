from __future__ import annotations

"""Sources Management API - Predator Analytics v45
API для управління джерелами даних (Telegram, Web, RSS, API).
"""
from datetime import datetime
from typing import Any
import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select, update

from app.libs.core.database import get_db_ctx
from app.libs.core.models.entities import DataSource as DataSourceEntity
from app.libs.core.structured_logger import get_logger
from app.services.auth_service import get_current_user

logger = get_logger("api.sources_management")
router = APIRouter(prefix="/sources", tags=["Джерела Даних"])


# ============================================================================
# SCHEMAS
# ============================================================================


class SourceConfigBase(BaseModel):
    """Базова конфігурація джерела."""

    name: str = Field(..., min_length=1, max_length=255, description="Назва джерела")
    type: str = Field(..., description="Тип: telegram, web, rss, registry, api")
    url: str | None = Field(None, description="URL для web/rss/api")
    channelUsername: str | None = Field(None, description="Username Telegram каналу")
    apiKey: str | None = Field(None, description="API ключ для авторизації")
    schedule: str | None = Field(None, description="Cron розклад оновлення")
    sector: str | None = Field(None, description="Сектор: GOV, BIZ, MED, SCI, FIN, LAW")
    usePlaywright: bool | None = Field(False, description="Використовувати JS рендеринг")
    followLinks: bool | None = Field(False, description="Слідувати за посиланнями")
    maxDepth: int | None = Field(1, ge=1, le=5, description="Максимальна глибина обходу")


class SourceCreate(SourceConfigBase):
    """Створення нового джерела."""


class SourceUpdate(BaseModel):
    """Оновлення джерела."""

    name: str | None = None
    url: str | None = None
    channelUsername: str | None = None
    schedule: str | None = None
    sector: str | None = None
    status: str | None = None


class SourceResponse(BaseModel):
    """Відповідь з інформацією про джерело."""

    id: str
    name: str
    type: str
    status: str
    connector: str
    sector: str | None
    schedule: str | None
    config: dict[str, Any]
    records_count: int
    last_sync: str | None
    created_at: str
    updated_at: str | None

    class Config:
        from_attributes = True


class TestSourceRequest(SourceConfigBase):
    """Запит на тестування джерела."""


class TestSourceResponse(BaseModel):
    """Результат тестування."""

    success: bool
    message: str
    records_count: int = 0
    latency_ms: float = 0
    sample_data: list[dict] | None = None


class SyncSourceRequest(BaseModel):
    """Запит на синхронізацію."""

    force: bool = False
    limit: int | None = 100


# ============================================================================
# HELPERS
# ============================================================================


def _get_connector_for_type(source_type: str):
    """Отримати connector для типу джерела."""
    if source_type == "telegram":
        from app.connectors.telegram_channel import telegram_channel_connector

        return telegram_channel_connector
    if source_type == "web":
        from app.connectors.web_scraper import web_scraper_connector

        return web_scraper_connector
    if source_type == "rss":
        from app.connectors.web_scraper import web_scraper_connector

        return web_scraper_connector  # RSS обробляється тим же connector
    if source_type == "registry":
        from app.connectors.ckan_generic import ckan_connector

        return ckan_connector
    if source_type == "api":
        # Generic API connector
        return None
    return None


async def _run_sync(source_id: str, source: DataSourceEntity):
    """Фоновий процес синхронізації."""
    import time

    start_time = time.time()

    try:
        connector = _get_connector_for_type(source.source_type)
        if not connector:
            logger.error(f"Connector не знайдено для типу {source.source_type}")
            return

        config = source.config or {}

        # Виконуємо синхронізацію залежно від типу
        if source.source_type == "telegram":
            result = await connector.fetch_channel_history(
                config.get("channelUsername"), limit=config.get("limit", 100)
            )
        elif source.source_type == "web":
            result = await connector.search(
                config.get("url"),
                use_playwright=config.get("usePlaywright", False),
                follow_links=config.get("followLinks", False),
                max_depth=config.get("maxDepth", 1),
            )
        elif source.source_type == "rss":
            result = await connector.scrape_rss_feed(config.get("url"))
        else:
            result = await connector.search(config.get("url") or "", limit=100)

        # Оновлюємо статус джерела
        async with get_db_ctx() as sess:
            await sess.execute(
                update(DataSourceEntity)
                .where(DataSourceEntity.id == uuid.UUID(source_id))
                .values(
                    status="indexed" if result.success else "error",
                    config={
                        **config,
                        "last_sync": datetime.utcnow().isoformat(),
                        "last_count": result.records_count,
                        "sync_duration_ms": (time.time() - start_time) * 1000,
                    },
                )
            )
            await sess.commit()

        if result.success:
            logger.info(f"Синхронізація успішна: {source.name}, записів: {result.records_count}")

            # TODO: Записати дані в staging.raw_data для подальшої обробки ETL

        else:
            logger.error(f"Синхронізація невдала: {source.name}, помилка: {result.error}")

    except Exception as e:
        logger.exception(f"Помилка синхронізації джерела {source_id}: {e}")

        async with get_db_ctx() as sess:
            await sess.execute(
                update(DataSourceEntity)
                .where(DataSourceEntity.id == uuid.UUID(source_id))
                .values(status="error")
            )
            await sess.commit()


# ============================================================================
# ENDPOINTS
# ============================================================================


@router.get("/", response_model=list[SourceResponse])
async def list_sources(
    type: str | None = None,
    status: str | None = None,
    sector: str | None = None,
    user: dict = Depends(get_current_user),
):
    """Отримати список всіх джерел даних.

    Параметри фільтрації:
    - type: telegram, web, rss, registry, api
    - status: draft, active, indexed, error, disabled
    - sector: GOV, BIZ, MED, SCI, FIN, LAW
    """
    try:
        async with get_db_ctx() as sess:
            stmt = select(DataSourceEntity).order_by(DataSourceEntity.created_at.desc())

            # Фільтри
            if type:
                stmt = stmt.where(DataSourceEntity.source_type == type)
            if status:
                stmt = stmt.where(DataSourceEntity.status == status)
            if sector:
                stmt = stmt.where(DataSourceEntity.sector == sector)

            result = await sess.execute(stmt)
            sources = result.scalars().all()

            return [
                SourceResponse(
                    id=str(s.id),
                    name=s.name,
                    type=s.source_type,
                    status=s.status,
                    connector=s.connector,
                    sector=s.sector,
                    schedule=s.schedule.get("cron") if s.schedule else None,
                    config=s.config or {},
                    records_count=s.config.get("last_count", 0) if s.config else 0,
                    last_sync=s.config.get("last_sync") if s.config else None,
                    created_at=s.created_at.isoformat() if s.created_at else "",
                    updated_at=s.updated_at.isoformat() if s.updated_at else None,
                )
                for s in sources
            ]

    except Exception as e:
        logger.exception(f"Помилка отримання джерел: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", response_model=SourceResponse)
async def create_source(source: SourceCreate, user: dict = Depends(get_current_user)):
    """Створити нове джерело даних."""
    try:
        # Визначаємо connector
        connector_map = {
            "telegram": "telegram_channel",
            "web": "web_scraper",
            "rss": "rss_feed",
            "registry": "ckan_api",
            "api": "rest_api",
        }
        connector = connector_map.get(source.type, "unknown")

        # Формуємо конфігурацію
        config = {
            "url": source.url,
            "channelUsername": source.channelUsername,
            "usePlaywright": source.usePlaywright,
            "followLinks": source.followLinks,
            "maxDepth": source.maxDepth,
        }

        # Видаляємо None значення
        config = {k: v for k, v in config.items() if v is not None}

        # Формуємо schedule
        schedule = {"cron": source.schedule} if source.schedule else None

        async with get_db_ctx() as sess:
            new_source = DataSourceEntity(
                id=uuid.uuid4(),
                name=source.name,
                source_type=source.type,
                connector=connector,
                status="draft",
                tenant_id=uuid.UUID(user.get("tenant_id", "00000000-0000-0000-0000-000000000000")),
                config=config,
                sector=source.sector,
                schedule=schedule,
            )

            sess.add(new_source)
            await sess.commit()
            await sess.refresh(new_source)

            logger.info(f"Створено джерело: {source.name} (тип: {source.type})")

            return SourceResponse(
                id=str(new_source.id),
                name=new_source.name,
                type=new_source.source_type,
                status=new_source.status,
                connector=new_source.connector,
                sector=new_source.sector,
                schedule=source.schedule,
                config=config,
                records_count=0,
                last_sync=None,
                created_at=new_source.created_at.isoformat(),
                updated_at=None,
            )

    except Exception as e:
        logger.exception(f"Помилка створення джерела: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{source_id}", response_model=SourceResponse)
async def get_source(source_id: str, user: dict = Depends(get_current_user)):
    """Отримати інформацію про конкретне джерело."""
    try:
        async with get_db_ctx() as sess:
            source = await sess.get(DataSourceEntity, uuid.UUID(source_id))

            if not source:
                raise HTTPException(status_code=404, detail="Джерело не знайдено")

            return SourceResponse(
                id=str(source.id),
                name=source.name,
                type=source.source_type,
                status=source.status,
                connector=source.connector,
                sector=source.sector,
                schedule=source.schedule.get("cron") if source.schedule else None,
                config=source.config or {},
                records_count=source.config.get("last_count", 0) if source.config else 0,
                last_sync=source.config.get("last_sync") if source.config else None,
                created_at=source.created_at.isoformat(),
                updated_at=source.updated_at.isoformat() if source.updated_at else None,
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Помилка отримання джерела {source_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{source_id}", response_model=SourceResponse)
async def update_source(
    source_id: str, source_update: SourceUpdate, user: dict = Depends(get_current_user)
):
    """Оновити джерело даних."""
    try:
        async with get_db_ctx() as sess:
            source = await sess.get(DataSourceEntity, uuid.UUID(source_id))

            if not source:
                raise HTTPException(status_code=404, detail="Джерело не знайдено")

            # Оновлюємо тільки надані поля
            update_data = source_update.dict(exclude_unset=True)

            if "name" in update_data:
                source.name = update_data["name"]
            if "status" in update_data:
                source.status = update_data["status"]
            if "sector" in update_data:
                source.sector = update_data["sector"]
            if "schedule" in update_data:
                source.schedule = {"cron": update_data["schedule"]}

            # Оновлюємо конфігурацію
            config_updates = {}
            if "url" in update_data:
                config_updates["url"] = update_data["url"]
            if "channelUsername" in update_data:
                config_updates["channelUsername"] = update_data["channelUsername"]

            if config_updates:
                source.config = {**(source.config or {}), **config_updates}

            await sess.commit()
            await sess.refresh(source)

            logger.info(f"Оновлено джерело: {source.name}")

            return SourceResponse(
                id=str(source.id),
                name=source.name,
                type=source.source_type,
                status=source.status,
                connector=source.connector,
                sector=source.sector,
                schedule=source.schedule.get("cron") if source.schedule else None,
                config=source.config or {},
                records_count=source.config.get("last_count", 0) if source.config else 0,
                last_sync=source.config.get("last_sync") if source.config else None,
                created_at=source.created_at.isoformat(),
                updated_at=source.updated_at.isoformat() if source.updated_at else None,
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Помилка оновлення джерела {source_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{source_id}")
async def delete_source(source_id: str, user: dict = Depends(get_current_user)):
    """Видалити джерело даних."""
    try:
        async with get_db_ctx() as sess:
            source = await sess.get(DataSourceEntity, uuid.UUID(source_id))

            if not source:
                raise HTTPException(status_code=404, detail="Джерело не знайдено")

            source_name = source.name
            await sess.delete(source)
            await sess.commit()

            logger.info(f"Видалено джерело: {source_name}")

            return {"status": "deleted", "id": source_id, "name": source_name}

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Помилка видалення джерела {source_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/test", response_model=TestSourceResponse)
async def test_source_connection(config: TestSourceRequest, user: dict = Depends(get_current_user)):
    """Тестувати підключення до джерела без збереження."""
    import time

    start_time = time.time()

    try:
        connector = _get_connector_for_type(config.type)

        if not connector:
            return TestSourceResponse(
                success=False, message=f"Connector для типу '{config.type}' не підтримується"
            )

        # Виконуємо тестовий запит
        if config.type == "telegram":
            if not config.channelUsername:
                return TestSourceResponse(success=False, message="Не вказано username каналу")
            result = await connector.get_by_id(config.channelUsername)

        elif config.type == "web":
            if not config.url:
                return TestSourceResponse(success=False, message="Не вказано URL")
            result = await connector.search(
                config.url, limit=1, use_playwright=config.usePlaywright
            )

        elif config.type == "rss":
            if not config.url:
                return TestSourceResponse(success=False, message="Не вказано URL фіду")
            result = await connector.scrape_rss_feed(config.url)

        else:
            if not config.url:
                return TestSourceResponse(success=False, message="Не вказано URL")
            result = await connector.search(config.url, limit=5)

        latency_ms = (time.time() - start_time) * 1000

        if result.success:
            # Формуємо sample_data
            sample_data = None
            if result.data:
                if isinstance(result.data, list):
                    sample_data = result.data[:3]  # Перші 3 записи
                elif isinstance(result.data, dict):
                    sample_data = [result.data]

            return TestSourceResponse(
                success=True,
                message=f"Підключення успішне! Знайдено {result.records_count} записів",
                records_count=result.records_count,
                latency_ms=round(latency_ms, 2),
                sample_data=sample_data,
            )
        return TestSourceResponse(
            success=False,
            message=result.error or "Невідома помилка",
            latency_ms=round(latency_ms, 2),
        )

    except Exception as e:
        logger.exception(f"Помилка тестування джерела: {e}")
        return TestSourceResponse(success=False, message=str(e))


@router.post("/{source_id}/sync")
async def sync_source(
    source_id: str,
    request: SyncSourceRequest,
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_current_user),
):
    """Запустити синхронізацію джерела даних (фоновий процес)."""
    try:
        async with get_db_ctx() as sess:
            source = await sess.get(DataSourceEntity, uuid.UUID(source_id))

            if not source:
                raise HTTPException(status_code=404, detail="Джерело не знайдено")

            # Оновлюємо статус на "syncing"
            source.status = "parsing"
            if request.limit:
                source.config = {**(source.config or {}), "limit": request.limit}
            await sess.commit()

            # Запускаємо фоновий процес
            background_tasks.add_task(_run_sync, source_id, source)

            logger.info(f"Запущено синхронізацію джерела: {source.name}")

            return {
                "status": "started",
                "source_id": source_id,
                "source_name": source.name,
                "message": "Синхронізацію запущено у фоновому режимі",
            }

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Помилка запуску синхронізації {source_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{source_id}/preview")
async def preview_source_data(
    source_id: str, limit: int = 10, user: dict = Depends(get_current_user)
):
    """Переглянути дані з джерела (без збереження)."""
    try:
        async with get_db_ctx() as sess:
            source = await sess.get(DataSourceEntity, uuid.UUID(source_id))

            if not source:
                raise HTTPException(status_code=404, detail="Джерело не знайдено")

            connector = _get_connector_for_type(source.source_type)
            if not connector:
                raise HTTPException(status_code=400, detail="Connector не підтримується")

            config = source.config or {}

            # Отримуємо дані
            if source.source_type == "telegram":
                result = await connector.search(config.get("channelUsername", ""), limit=limit)
            elif source.source_type == "rss":
                result = await connector.scrape_rss_feed(config.get("url", ""))
            else:
                result = await connector.search(config.get("url", ""), limit=limit)

            if result.success:
                return {
                    "source_id": source_id,
                    "source_name": source.name,
                    "records_count": result.records_count,
                    "data": result.data[:limit] if isinstance(result.data, list) else result.data,
                }
            raise HTTPException(status_code=400, detail=result.error)

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Помилка preview джерела {source_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
