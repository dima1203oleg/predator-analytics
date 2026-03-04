"""Predator v55.0 — Celery Task: V55 Ingestion Pipeline.

Обгортка для запуску run_full_pipeline з Celery worker.
Оновлює статус job у Redis.
"""

from __future__ import annotations

import asyncio
import json
import logging
from datetime import UTC, datetime
from typing import Any

from celery import shared_task

logger = logging.getLogger("predator.tasks.pipeline_v55")


def _get_redis_sync():
    """Синхронний Redis клієнт для Celery worker."""
    import redis  # type: ignore[import]

    from app.libs.core.config import settings

    return redis.Redis(
        host=getattr(settings, "REDIS_HOST", "redis"),
        port=int(getattr(settings, "REDIS_PORT", 6379)),
        decode_responses=True,
    )


def _update_job(r, job_id: str, data: dict) -> None:
    try:
        r.setex(f"job:{job_id}", 3600, json.dumps(data))
    except Exception as e:
        logger.warning("Не вдалося оновити job %s: %s", job_id, e)


@shared_task(
    name="tasks.pipeline.run_v55_ingestion_task",
    queue="ingestion",
    bind=True,
    max_retries=2,
    default_retry_delay=30,
)
def run_v55_ingestion_task(
    self,
    job_id: str,
    records: list[dict[str, Any]],
    source: str,
    entity_type: str = "company",
) -> dict[str, Any]:
    """Celery task: запускає повний аналітичний pipeline для пакету записів.

    Args:
        job_id: Ідентифікатор задачі (для SSE прогресу через Redis).
        records: Список сирих записів.
        source: Джерело даних (customs | tax | edr | ...).
        entity_type: Тип сутності.
    """
    r = None
    job: dict[str, Any] = {
        "job_id": job_id,
        "status": "running",
        "source": source,
        "records_total": len(records),
        "records_processed": 0,
        "entities_created": 0,
        "entities_resolved": 0,
        "errors": [],
        "started_at": datetime.now(UTC).isoformat(),
        "finished_at": None,
    }

    try:
        r = _get_redis_sync()
        _update_job(r, job_id, job)
    except Exception:
        logger.warning("Redis недоступний — job tracking вимкнено")

    async def _run():
        from app.core.db import async_session_maker  # type: ignore[import]
        from app.engines.pipeline import run_full_pipeline

        async with async_session_maker() as session:
            result = await run_full_pipeline(
                db=session,
                records=records,
                source=source,
                entity_type=entity_type,
            )
            return result

    try:
        result = asyncio.run(_run())

        job["status"] = "done"
        fusion_step = result.get("steps", {}).get("data_fusion", {})
        job["records_processed"] = len(records) - len(result.get("steps", {}).get("errors", []))
        job["entities_created"] = fusion_step.get("entities_created", 0)
        job["entities_resolved"] = fusion_step.get("entities_resolved", 0)
        job["errors"] = result.get("steps", {}).get("errors", [])[:20]  # Max 20 errors
        job["finished_at"] = datetime.now(UTC).isoformat()

        logger.info(
            "V55 pipeline завершено: job_id=%s entities_created=%d entities_resolved=%d",
            job_id,
            job["entities_created"],
            job["entities_resolved"],
        )

    except Exception as exc:
        logger.exception("V55 pipeline failed: job_id=%s", job_id)
        job["status"] = "failed"
        job["errors"] = [str(exc)]
        job["finished_at"] = datetime.now(UTC).isoformat()

        try:
            self.retry(exc=exc)
        except self.MaxRetriesExceededError:
            logger.error("Max retries exceeded for job_id=%s", job_id)

    finally:
        if r:
            try:
                _update_job(r, job_id, job)
                r.close()
            except Exception:
                pass

    return job
