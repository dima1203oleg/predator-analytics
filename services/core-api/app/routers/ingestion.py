"""Ingestion Router — PREDATOR Analytics v55.2-SM-EXTENDED.

Triggering and monitoring data ingestion pipelines.
Реалізація згідно TZ §2.2.3 з Kafka та MinIO інтеграцією.
SSE підтримка для real-time прогресу.
"""
import asyncio
from collections.abc import AsyncGenerator
import hashlib
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import Permission
from app.database import get_db
from app.dependencies import PermissionChecker, get_current_active_user, get_tenant_id
from app.services.kafka_service import get_kafka_service
from app.services.minio_service import get_minio_service
from predator_common.logging import get_logger
from predator_common.models import IngestionJob

logger = get_logger("core_api.ingestion")

router = APIRouter(prefix="/ingestion", tags=["ingestion"])


# ======================== МОДЕЛІ ========================

class UploadResponse(BaseModel):
    """Відповідь на завантаження файлу."""

    job_id: str
    status: str = "queued"
    file_size_bytes: int
    estimated_rows: int | None = None
    chunks: int = 1
    progress_url: str
    estimated_completion_seconds: int | None = None


class JobStatusResponse(BaseModel):
    """Статус ingestion job."""

    job_id: str
    status: str
    file_name: str | None = None
    total_records: int | None = None
    successful_records: int = 0
    failed_records: int = 0
    progress_pct: int = 0
    created_at: str | None = None
    started_at: str | None = None
    completed_at: str | None = None
    error_summary: str | None = None


# ======================== ЕНДПОЇНТИ ========================

@router.post("/upload", response_model=UploadResponse, status_code=202)
async def upload_file(
    file: UploadFile = File(...),
    dataset_name: str = Form(None),
    description: str = Form(None),
    tenant_id: str = Depends(get_tenant_id),
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
    _ = Depends(PermissionChecker([Permission.WRITE_CORP_DATA])),
):
    """Завантаження файлу для інгестування. Згідно TZ §2.2.3."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="Файл не вказано")

    # Перевірка формату
    allowed_extensions = {".xlsx", ".xls", ".csv", ".json"}
    file_ext = "." + file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Непідтримуваний формат. Дозволені: {', '.join(allowed_extensions)}"
        )

    # Читаємо вміст файлу
    content = await file.read()
    file_size = len(content)
    content_hash = hashlib.sha256(content).hexdigest()

    # Створюємо job в БД
    job_id = str(uuid.uuid4())
    user_id = current_user.get("sub")

    new_job = IngestionJob(
        id=job_id,
        tenant_id=tenant_id,
        user_id=user_id,
        job_type="file_upload",
        file_name=file.filename,
        file_size=file_size,
        status="queued",
        progress=0,
    )
    db.add(new_job)
    await db.commit()

    # Зберігаємо файл в MinIO/S3 (ізоляція по тенанту)
    minio = get_minio_service()
    await minio.ensure_tenant_buckets(tenant_id)

    object_name = f"{job_id}/{file.filename}"
    content_type = file.content_type or "application/octet-stream"
    bucket_name = minio.get_raw_bucket(tenant_id)

    _success, s3_path, _ = await minio.upload_file(
        bucket=bucket_name,
        object_name=object_name,
        data=content,
        content_type=content_type,
    )

    # Відправляємо подію в Kafka
    kafka = get_kafka_service()
    await kafka.publish_file_upload(
        job_id=job_id,
        tenant_id=tenant_id,
        user_id=user_id,
        file_name=file.filename,
        file_size=file_size,
        content_hash=content_hash,
        s3_path=s3_path,
    )

    # Оцінка кількості рядків (приблизно)
    estimated_rows = file_size // 200 if file_ext == ".csv" else file_size // 500

    return UploadResponse(
        job_id=job_id,
        status="queued",
        file_size_bytes=file_size,
        estimated_rows=estimated_rows,
        chunks=max(1, file_size // (50 * 1024 * 1024)),
        progress_url=f"/api/v1/ingestion/progress/{job_id}",
        estimated_completion_seconds=max(30, estimated_rows // 500),
    )


@router.get("/progress/{job_id}")
async def get_job_progress(
    job_id: str,
    tenant_id: str = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA])),
):
    """Отримання прогресу ingestion job (polling). Згідно TZ §2.2.3."""
    result = await db.execute(
        select(IngestionJob).where(
            IngestionJob.id == job_id,
            IngestionJob.tenant_id == tenant_id,
        )
    )
    job = result.scalar_one_or_none()

    if not job:
        raise HTTPException(status_code=404, detail="Job не знайдено")

    return JobStatusResponse(
        job_id=str(job.id),
        status=job.status,
        file_name=job.file_name,
        total_records=job.records_total,
        successful_records=job.records_processed or 0,
        failed_records=job.records_errors or 0,
        progress_pct=job.progress or 0,
        created_at=job.created_at.isoformat() if job.created_at else None,
        started_at=job.started_at.isoformat() if job.started_at else None,
        completed_at=job.completed_at.isoformat() if job.completed_at else None,
        error_summary=job.error_message,
    )


@router.get("/progress/{job_id}/stream")
async def stream_job_progress(
    job_id: str,
    request: Request,
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA])),
):
    """SSE стрім прогресу ingestion job. Згідно TZ §2.2.3.

    Повертає Server-Sent Events з оновленнями прогресу кожні 2 секунди.
    Стрім завершується коли job досягає статусу 'completed' або 'failed'.
    """

    async def event_generator() -> AsyncGenerator[str, None]:
        """Генератор SSE подій."""
        from app.database import async_session_maker

        last_progress = -1
        terminal_statuses = {"completed", "failed", "cancelled"}

        while True:
            # Перевіряємо чи клієнт ще підключений
            if await request.is_disconnected():
                logger.info(f"SSE client disconnected for job {job_id}")
                break

            try:
                async with async_session_maker() as db:
                    result = await db.execute(
                        select(IngestionJob).where(
                            IngestionJob.id == job_id,
                            IngestionJob.tenant_id == tenant_id,
                        )
                    )
                    job = result.scalar_one_or_none()

                    if not job:
                        yield "event: error\ndata: {\"error\": \"Job не знайдено\"}\n\n"
                        break

                    current_progress = job.progress or 0

                    # Відправляємо оновлення тільки якщо є зміни
                    if current_progress != last_progress or job.status in terminal_statuses:
                        import json

                        event_data = {
                            "job_id": str(job.id),
                            "status": job.status,
                            "progress_pct": current_progress,
                            "records_processed": job.records_processed or 0,
                            "records_errors": job.records_errors or 0,
                            "file_name": job.file_name,
                        }

                        if job.status == "completed":
                            event_data["completed_at"] = (
                                job.completed_at.isoformat() if job.completed_at else None
                            )

                        yield f"event: progress\ndata: {json.dumps(event_data, ensure_ascii=False)}\n\n"
                        last_progress = current_progress

                    # Завершуємо стрім якщо job завершено
                    if job.status in terminal_statuses:
                        yield f"event: done\ndata: {{\"status\": \"{job.status}\"}}\n\n"
                        break

            except Exception as e:
                logger.error(f"SSE error for job {job_id}: {e}")
                yield "event: error\ndata: {\"error\": \"Внутрішня помилка сервера\"}\n\n"
                break

            # Чекаємо 2 секунди перед наступним оновленням
            await asyncio.sleep(2)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/trigger")
async def trigger_ingestion(
    source: str,
    _ = Depends(PermissionChecker([Permission.WRITE_CORP_DATA]))
):
    """Тригер запуску пайплайну імпорту даних."""
    # TODO: Push to Kafka topic 'ingestion-triggers'
    return {"status": "triggered", "source": source}


@router.get("/status")
async def get_ingestion_status(
    tenant_id: str = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA])),
):
    """Статус активних пайплайнів."""
    active_count = await db.scalar(
        select(func.count())
        .select_from(IngestionJob)
        .where(
            IngestionJob.tenant_id == tenant_id,
            IngestionJob.status.in_(["pending", "running", "queued"]),
        )
    ) or 0
    return {"active_jobs": active_count}


@router.get("/jobs")
async def list_jobs(
    tenant_id: str = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
    limit: int = 20,
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA])),
):
    """Список останніх ingestion jobs."""
    result = await db.execute(
        select(IngestionJob)
        .where(IngestionJob.tenant_id == tenant_id)
        .order_by(IngestionJob.created_at.desc())
        .limit(limit)
    )
    jobs = result.scalars().all()

    return [
        JobStatusResponse(
            job_id=str(j.id),
            status=j.status,
            file_name=j.file_name,
            total_records=j.records_total,
            successful_records=j.records_processed or 0,
            failed_records=j.records_errors or 0,
            progress_pct=j.progress or 0,
            created_at=j.created_at.isoformat() if j.created_at else None,
            started_at=j.started_at.isoformat() if j.started_at else None,
            completed_at=j.completed_at.isoformat() if j.completed_at else None,
            error_summary=j.error_message,
        )
        for j in jobs
    ]
