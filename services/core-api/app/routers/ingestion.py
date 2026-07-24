"""Ingestion Router — PREDATOR Analytics v55.2-SM-EXTENDED.

Triggering and monitoring data ingestion pipelines.
Реалізація згідно TZ §2.2.3 з Kafka та MinIO інтеграцією.
SSE підтримка для real-time прогресу.
"""
import asyncio
from collections.abc import AsyncGenerator
import hashlib
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.core.security import get_current_user_payload
from app.core.permissions import ROLE_PERMISSIONS, Role
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import Permission
from app.database import get_db
from app.dependencies import PermissionChecker, get_current_active_user, get_tenant_id
from app.services.kafka_service import get_kafka_service
from app.services.minio_service import get_minio_service
from predator_common.logging import get_logger
from predator_common.models import IngestionJob
from app.services.tus_service import get_tus_service
from fastapi.responses import StreamingResponse, Response

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


class SourceIngestionRequest(BaseModel):
    """Запит на моніторинг зовнішнього ресурсу (Веб, TG, FB)."""
    type: str  # "web", "telegram", "social", "api"
    url: str
    config: dict = {}
    description: str | None = None



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
    warnings: list[str] | None = None


# ======================== ЕНДПОЇНТИ ========================

@router.options("/tus/files")
@router.options("/tus/files/{file_id}")
async def tus_options():
    """OPTIONS для TUS."""
    return Response(
        status_code=204,
        headers={
            "Tus-Resumable": "1.0.0",
            "Tus-Version": "1.0.0",
            "Tus-Extension": "creation,termination",
            "Access-Control-Expose-Headers": "Tus-Resumable, Tus-Version, Tus-Extension, Upload-Offset, Upload-Length, Location",
        }
    )


@router.post("/tus/files", status_code=201)
async def tus_create_file(
    request: Request,
    tenant_id: str = Depends(get_tenant_id),
    current_user: dict = Depends(get_current_active_user),
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA])),
):
    """Створення нової TUS сесії."""
    upload_length = int(request.headers.get("Upload-Length", 0))
    upload_metadata = request.headers.get("Upload-Metadata", "")

    if upload_length == 0:
        raise HTTPException(status_code=400, detail="Upload-Length header is required and must be > 0")

    job_id = str(uuid.uuid4())
    user_id = current_user.get("sub")
    
    tus = get_tus_service()
    await tus.create_upload(
        file_id=job_id, 
        upload_length=upload_length, 
        metadata={"tenant_id": tenant_id, "user_id": user_id, "meta": upload_metadata}
    )

    return Response(
        status_code=201,
        headers={
            "Location": f"/api/v1/ingestion/tus/files/{job_id}",
            "Tus-Resumable": "1.0.0",
            "Access-Control-Expose-Headers": "Location, Tus-Resumable",
        }
    )


@router.head("/tus/files/{file_id}")
async def tus_head_file(file_id: str):
    """Отримання поточного стану TUS завантаження."""
    tus = get_tus_service()
    offset = await tus.get_offset(file_id)
    if offset is None:
        raise HTTPException(status_code=404, detail="Upload not found")
        
    length = await tus.get_length(file_id)
    
    return Response(
        status_code=200,
        headers={
            "Upload-Offset": str(offset),
            "Upload-Length": str(length),
            "Tus-Resumable": "1.0.0",
            "Access-Control-Expose-Headers": "Upload-Offset, Upload-Length, Tus-Resumable",
        }
    )


@router.patch("/tus/files/{file_id}")
async def tus_patch_file(
    file_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Завантаження chunk'у даних."""
    tus = get_tus_service()
    offset = await tus.get_offset(file_id)
    if offset is None:
        raise HTTPException(status_code=404, detail="Upload not found")
        
    req_offset = int(request.headers.get("Upload-Offset", "-1"))
    if req_offset != offset:
        raise HTTPException(status_code=409, detail=f"Offset mismatch. Expected {offset}")

    content_type = request.headers.get("Content-Type", "")
    if content_type != "application/offset+octet-stream":
        raise HTTPException(status_code=415, detail="Invalid Content-Type")

    length = await tus.get_length(file_id)
    chunk = await request.body()
    
    if not chunk:
        # Empty chunk, just return current offset
        return Response(status_code=204, headers={"Upload-Offset": str(offset), "Tus-Resumable": "1.0.0"})

    import os
    tmp_path = f"/tmp/tus_{file_id}.tmp"
    with open(tmp_path, "ab") as f:
        f.write(chunk)
        
    new_offset = offset + len(chunk)
    await tus.update_offset(file_id, new_offset)
    
    # Якщо завантаження завершено
    if new_offset >= length:
        meta = await tus.get_metadata(file_id)
        if meta:
            tenant_id = meta.get("tenant_id")
            user_id = meta.get("user_id")
            
            # 1. Запис в БД
            new_job = IngestionJob(
                id=file_id,
                tenant_id=tenant_id,
                user_id=user_id,
                job_type="tus_upload",
                file_name="tus_upload.bin",
                file_size=length,
                status="queued",
                progress=0,
            )
            db.add(new_job)
            await db.commit()

            # 2. Перенесення файлу в MinIO
            minio = get_minio_service()
            try:
                # Use a safe fallback if ensure_tenant_buckets fails
                if hasattr(minio, "ensure_tenant_buckets"):
                    await minio.ensure_tenant_buckets(tenant_id)
            except Exception:
                pass
            bucket_name = minio.get_raw_bucket(tenant_id) if hasattr(minio, "get_raw_bucket") else "raw-uploads"
            object_name = f"{file_id}/uploaded.bin"
            
            with open(tmp_path, "rb") as f:
                data = f.read()
                
            content_hash = hashlib.sha256(data).hexdigest()
            success, s3_path, _ = await minio.upload_file(
                bucket=bucket_name,
                object_name=object_name,
                data=data,
            )
            
            os.remove(tmp_path)
            await tus.delete_upload(file_id)

            # 3. Подія в Kafka
            kafka = get_kafka_service()
            await kafka.publish_file_upload(
                job_id=file_id,
                tenant_id=tenant_id,
                user_id=user_id,
                file_name="tus_upload.bin",
                file_size=length,
                content_hash=content_hash,
                s3_path=s3_path,
            )

    return Response(
        status_code=204,
        headers={
            "Upload-Offset": str(new_offset),
            "Tus-Resumable": "1.0.0",
            "Access-Control-Expose-Headers": "Upload-Offset, Tus-Resumable",
        }
    )

@router.post("/upload", response_model=UploadResponse, status_code=202)
async def upload_file(
    file: UploadFile = File(...),
    dataset_name: str = Form(None),
    description: str = Form(None),
    tenant_id: str = Depends(get_tenant_id),
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA])),
):
    """Завантаження файлу для інгестування. Згідно TZ §2.2.3."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="Файл не вказано")

    # Перевірка формату
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in [".csv", ".json", ".jsonl", ".parquet", ".xml", ".xlsx", ".xls", ".zip", ".gz", ".tar"]:
        raise HTTPException(status_code=400, detail=f"Непідтримуваний формат файлу: {file_ext}")

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
        file_size_bytes=file_size,
        estimated_rows=file_size // 1000,
        progress_url=f"/api/v1/ingestion/progress/{job_id}",
    )


@router.post("/source", response_model=UploadResponse, status_code=202)
async def add_monitoring_source(
    request: SourceIngestionRequest,
    tenant_id: str = Depends(get_tenant_id),
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA])),
):
    """Додавання ресурсу (Веб, Telegram, Соцмережі) для моніторингу."""
    job_id = str(uuid.uuid4())
    user_id = current_user.get("sub")

    # Створюємо IngestionJob у базі (PostgreSQL)
    new_job = IngestionJob(
        job_id=job_id,
        tenant_id=tenant_id,
        user_id=user_id,
        file_name=f"[{request.type.upper()}] {request.url}",
        file_size_bytes=0,
        status="queued",
    )
    db.add(new_job)
    await db.commit()

    # Відправляємо подію в Kafka для відповідного воркера
    kafka = get_kafka_service()
    
    # Визначаємо топік залежно від типу джерела
    topic = f"predator.source.{request.type}.start"
    
    # Використовуємо існуючий метод send (publish)
    await kafka.send(
        topic=topic,
        value={
            "job_id": job_id,
            "tenant_id": tenant_id,
            "user_id": user_id,
            "source_url": request.url,
            "source_type": request.type,
            "config": request.config,
            "description": request.description,
        },
        key=job_id
    )

    logger.info(f"Додано джерело для моніторингу: {request.url} (Job ID: {job_id})")

    return UploadResponse(
        job_id=job_id,
        file_size_bytes=0,
        estimated_rows=0,
        progress_url=f"/api/v1/ingestion/progress/{job_id}",
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
        warnings=job.metadata_.get("warnings", []) if job.metadata_ else [],
    )


@router.get("/progress/{job_id}/stream")
async def stream_job_progress(
    job_id: str,
    request: Request,
    token: str = Query(None),
    tenant_id: str = Depends(get_tenant_id),
):
    """SSE стрім прогресу ingestion job. Згідно TZ §2.2.3.

    Повертає Server-Sent Events з оновленнями прогресу кожні 2 секунди.
    Стрім завершується коли job досягає статусу 'completed' або 'failed'.
    """
    # Ручна перевірка токену для SSE, так як EventSource не підтримує headers
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            
    if not token:
        raise HTTPException(status_code=401, detail="Token required for SSE stream")
        
    payload = await get_current_user_payload(token)
    user_role_str = payload.get("role", "guest")
    try:
        user_role = Role(user_role_str)
    except ValueError:
        raise HTTPException(status_code=403, detail="Invalid role")
        
    if Permission.READ_CORP_DATA not in ROLE_PERMISSIONS.get(user_role, []):
        raise HTTPException(status_code=403, detail="Forbidden")

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
                            "warnings": job.metadata_.get("warnings", []) if job.metadata_ else [],
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
    tenant_id: str = Depends(get_tenant_id),
    current_user: dict = Depends(get_current_active_user),
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA]))
):
    """Тригер запуску пайплайну імпорту даних."""
    kafka = get_kafka_service()
    user_id = current_user.get("sub")
    await kafka.publish_ingestion_trigger(
        source=source,
        tenant_id=tenant_id,
        triggered_by=user_id
    )
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
            error_summary=j.error_message,
        )
        for j in jobs
    ]

@router.get("/{job_id}/verify")
async def verify_ingestion_consistency(
    job_id: str,
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA])),
):
    """
    Перевірка наявності даних у всіх БД (Data Flow Transparency Layer).
    """
    from app.services.data_lineage_service import get_data_lineage_service
    lineage_svc = get_data_lineage_service()
    result = await lineage_svc.verify_consistency(tenant_id, job_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result

@router.get("/{job_id}/lineage")
async def get_ingestion_lineage(
    job_id: str,
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA])),
):
    """
    Отримання повної історії подій по ingestion job (Graph Data).
    """
    from app.services.data_lineage_service import get_data_lineage_service
    lineage_svc = get_data_lineage_service()
    events = await lineage_svc.get_full_lineage(tenant_id, job_id)
    return {"ingestion_id": job_id, "events": events}
