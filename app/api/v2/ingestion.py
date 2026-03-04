"""Predator v55.0 — API v2: Ingestion (File Upload + SSE Progress).

F1-004: Базова інгестія v55
- POST /api/v2/ingestion/upload  — прийом Excel/CSV + data fusion
- GET  /api/v2/ingestion/progress/{job_id}  — SSE прогрес
- GET  /api/v2/ingestion/jobs  — список задач
- POST /api/v2/ingestion/trigger/{source_type}  — trigger ETL для джерела
"""

from __future__ import annotations

import asyncio
import json
import logging
import uuid
from datetime import UTC, datetime
from typing import Any, AsyncGenerator

import redis.asyncio as aioredis
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.libs.core.config import settings


logger = logging.getLogger("predator.api.v2.ingestion")
router = APIRouter(prefix="/ingestion", tags=["v2-ingestion"])


# ─── Redis helper ─────────────────────────────────────────────────────────────

def _get_redis() -> aioredis.Redis:
    return aioredis.Redis(
        host=getattr(settings, "REDIS_HOST", "redis"),
        port=int(getattr(settings, "REDIS_PORT", 6379)),
        decode_responses=True,
    )


# ─── Schemas ──────────────────────────────────────────────────────────────────

class UploadResponse(BaseModel):
    job_id: str
    status: str
    records_count: int | None = None
    message: str


class JobStatus(BaseModel):
    job_id: str
    status: str  # pending | running | done | failed
    source: str | None = None
    records_total: int = 0
    records_processed: int = 0
    entities_created: int = 0
    entities_resolved: int = 0
    errors: list[str] = Field(default_factory=list)
    started_at: str | None = None
    finished_at: str | None = None


# ─── Internal job tracker (Redis-backed) ─────────────────────────────────────

JOB_TTL = 3600  # 1 година


async def _set_job(r: aioredis.Redis, job_id: str, data: dict) -> None:
    await r.setex(f"job:{job_id}", JOB_TTL, json.dumps(data))


async def _get_job(r: aioredis.Redis, job_id: str) -> dict | None:
    raw = await r.get(f"job:{job_id}")
    if raw:
        return json.loads(raw)
    return None


# ─── POST /upload ─────────────────────────────────────────────────────────────

@router.post(
    "/upload",
    response_model=UploadResponse,
    summary="Завантажити файл (Excel/CSV) для інгестії",
)
async def upload_file(
    file: UploadFile = File(...),
    source: str = Query(default="customs", description="Джерело: customs | tax | edr | tender"),
    entity_type: str = Query(default="company", description="Тип сутності"),
    db: AsyncSession = Depends(get_db),
) -> UploadResponse:
    """Приймає Excel/CSV файл, парсить записи і запускає фоновий pipeline."""

    ALLOWED_SOURCES = {"customs", "tax", "edr", "court", "tender", "license", "media", "telegram"}
    if source not in ALLOWED_SOURCES:
        raise HTTPException(
            status_code=400,
            detail=f"Невідоме джерело '{source}'. Допустимі: {sorted(ALLOWED_SOURCES)}",
        )

    ALLOWED_EXTENSIONS = {".xlsx", ".xls", ".csv"}
    filename = file.filename or ""
    suffix = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Непідтримуваний формат '{suffix}'. Допустимі: {sorted(ALLOWED_EXTENSIONS)}",
        )

    try:
        content = await file.read()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Помилка читання файлу: {e}")

    # Парсинг — синхронний (pandas)
    records: list[dict] = []
    try:
        records = _parse_file(content, suffix, source)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Помилка парсингу файлу: {e}")

    if not records:
        raise HTTPException(status_code=422, detail="Файл порожній або не містить валідних рядків")

    if len(records) > 50_000:
        raise HTTPException(status_code=400, detail="Максимум 50 000 рядків за один завантаж")

    # Створити Job
    job_id = str(uuid.uuid4())
    r = _get_redis()
    try:
        await _set_job(r, job_id, {
            "job_id": job_id,
            "status": "pending",
            "source": source,
            "records_total": len(records),
            "records_processed": 0,
            "entities_created": 0,
            "entities_resolved": 0,
            "errors": [],
            "started_at": datetime.now(UTC).isoformat(),
            "finished_at": None,
        })
    except Exception:
        logger.warning("Redis недоступний — job tracking вимкнений")
    finally:
        await r.aclose()

    # Запускаємо фоновий pipeline через Celery або asyncio.create_task
    try:
        from app.tasks.pipeline_v55 import run_v55_ingestion_task  # type: ignore[import]
        run_v55_ingestion_task.delay(job_id, records, source, entity_type)
        logger.info("Celery task run_v55_ingestion_task queued: job_id=%s records=%d", job_id, len(records))
    except Exception as celery_err:
        # Fallback — asyncio background task (dev mode)
        logger.warning("Celery недоступний (%s), запускаємо asyncio task", celery_err)
        asyncio.create_task(_run_pipeline_bg(job_id, records, source, entity_type, db))

    return UploadResponse(
        job_id=job_id,
        status="pending",
        records_count=len(records),
        message=f"Файл '{filename}' прийнятий. {len(records)} записів у черзі.",
    )


# ─── GET /progress/{job_id} (SSE) ─────────────────────────────────────────────

@router.get(
    "/progress/{job_id}",
    summary="SSE-стрим прогресу інгестії",
    response_class=StreamingResponse,
)
async def get_progress(job_id: str) -> StreamingResponse:
    """Server-Sent Events: надсилає оновлення статусу задачі кожну секунду."""

    async def event_generator() -> AsyncGenerator[str, None]:
        r = _get_redis()
        try:
            last_status = None
            stale_count = 0
            while True:
                job = await _get_job(r, job_id)
                if not job:
                    yield f"event: error\ndata: {json.dumps({'error': 'Job не знайдено'})}\n\n"
                    break

                current_status = job.get("status")
                yield f"event: progress\ndata: {json.dumps(job)}\n\n"

                if current_status in ("done", "failed"):
                    break

                # Stale detection — якщо статус не змінився 60 секунд
                if current_status == last_status:
                    stale_count += 1
                    if stale_count >= 60:
                        yield f"event: timeout\ndata: {json.dumps({'job_id': job_id, 'message': 'Timeout'})}\n\n"
                        break
                else:
                    stale_count = 0
                    last_status = current_status

                await asyncio.sleep(1)
        finally:
            await r.aclose()

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ─── GET /jobs/{job_id} ────────────────────────────────────────────────────────

@router.get(
    "/jobs/{job_id}",
    response_model=JobStatus,
    summary="Статус конкретної задачі",
)
async def get_job_status(job_id: str) -> JobStatus:
    r = _get_redis()
    try:
        job = await _get_job(r, job_id)
    finally:
        await r.aclose()

    if not job:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' не знайдено")

    return JobStatus(**job)


# ─── POST /trigger/{source_type} ─────────────────────────────────────────────

@router.post(
    "/trigger/{source_type}",
    summary="Запустити ETL для зовнішнього джерела",
)
async def trigger_etl(
    source_type: str,
    config: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Запускає Celery task `parse_external_source` для вказаного джерела."""
    ALLOWED = {"prozorro", "nbu", "customs", "telegram", "rss", "web"}
    if source_type not in ALLOWED:
        raise HTTPException(
            status_code=400,
            detail=f"Невідоме джерело '{source_type}'. Допустимі: {sorted(ALLOWED)}",
        )

    try:
        from app.tasks.etl_workers import parse_external_source  # type: ignore[import]
        task = parse_external_source.delay(source_type, config or {})
        return {"status": "queued", "source": source_type, "task_id": task.id}
    except Exception as e:
        logger.exception("Не вдалося запустити ETL task")
        raise HTTPException(status_code=503, detail=f"Celery недоступний: {e}")


# ─── Internal: File Parser ────────────────────────────────────────────────────

def _parse_file(content: bytes, suffix: str, source: str) -> list[dict]:
    """Парсить Excel/CSV у список словників."""
    import io

    import pandas as pd  # type: ignore[import]

    if suffix in (".xlsx", ".xls"):
        df = pd.read_excel(io.BytesIO(content), dtype=str)
    else:
        # CSV — спробуємо декілька кодувань і роздільників
        for enc in ("utf-8", "cp1251", "latin-1"):
            try:
                df = pd.read_csv(io.BytesIO(content), dtype=str, encoding=enc, sep=None, engine="python")
                break
            except Exception:
                continue
        else:
            raise ValueError("Неможливо прочитати CSV")

    # Очищення
    df = df.dropna(how="all")
    df.columns = [str(c).strip().lower().replace(" ", "_") for c in df.columns]

    records = df.where(df.notna(), other=None).to_dict(orient="records")
    # Прибираємо None-ключі
    return [{k: v for k, v in r.items() if v is not None} for r in records]


# ─── Internal: asyncio fallback pipeline ────────────────────────────────────

async def _run_pipeline_bg(
    job_id: str,
    records: list[dict],
    source: str,
    entity_type: str,
    db: AsyncSession,
) -> None:
    """Фоновий asyncio task (fallback якщо Celery недоступний)."""
    from app.engines.pipeline import run_full_pipeline

    r = _get_redis()
    try:
        job = await _get_job(r, job_id) or {}
        job["status"] = "running"
        await _set_job(r, job_id, job)

        result = await run_full_pipeline(
            db=db,
            records=records,
            source=source,
            entity_type=entity_type,
        )

        job["status"] = "done"
        job["records_processed"] = result.get("unique_entities", len(records))
        job["entities_created"] = result.get("steps", {}).get("data_fusion", {}).get("entities_created", 0)
        job["entities_resolved"] = result.get("steps", {}).get("data_fusion", {}).get("entities_resolved", 0)
        job["finished_at"] = datetime.now(UTC).isoformat()
        await _set_job(r, job_id, job)

        logger.info("Pipeline bg-task done: job_id=%s", job_id)

    except Exception as e:
        logger.exception("Pipeline bg-task failed: job_id=%s", job_id)
        job["status"] = "failed"
        job["errors"] = [str(e)]
        job["finished_at"] = datetime.now(UTC).isoformat()
        try:
            await _set_job(r, job_id, job)
        except Exception:
            pass
    finally:
        await r.aclose()
