import asyncio
from datetime import datetime
import json
import logging
import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.connectors.telegram_channel import telegram_channel_connector
from app.models.ingestion import (
    IngestionJob,
    IngestionProgress,
    IngestionResponse,
    IngestionStatus,
)
from app.services.ingestion_service import IngestionService
from app.services.telegram_pipeline import get_telegram_pipeline

# In a real app, use a real auth dependency. Mocking for now if file doesn't exist
try:
    from app.core.security import get_current_user
except ImportError:

    async def get_current_user():
        return type("User", (), {"id": "mock-user-id"})


router = APIRouter(prefix="/ingest", tags=["ingestion"])
logger = logging.getLogger(__name__)

# In-memory storage for jobs (Use Redis in production)
ingestion_jobs: dict = {}


class TelegramIngestRequest(BaseModel):
    url: str
    name: str | None = None
    sector: str | None = None
    limit: int = 100


async def process_file_async(
    job_id: str,
    content: bytes,
    filename: str,
    file_type: str,
    user_id: str,
    dataset_name: str | None,
):
    """Background task to process file with granular progress updates."""
    job = ingestion_jobs.get(job_id)
    if not job:
        return

    service = IngestionService()

    try:
        # Phase 1: Validation
        job.status = IngestionStatus.VALIDATING
        job.progress.stage = "validating"
        job.progress.message = "Перевірка структури файлу..."
        job.updated_at = datetime.utcnow()
        await asyncio.sleep(0.5)  # UX feel

        await service.validate_file(content, file_type)
        job.progress.percent = 10

        # Phase 2: Parsing
        job.status = IngestionStatus.PARSING
        job.progress.stage = "parsing"
        job.progress.message = "Читання та парсинг даних..."
        job.updated_at = datetime.utcnow()

        records = []
        if file_type in [".xlsx", ".xls", ".csv"]:
            records = await service.parse_excel(content, filename)
        elif file_type == ".pdf":
            records = await service.parse_pdf(content)
        elif file_type in [".docx", ".doc", ".txt"]:
            records = await service.parse_document(content, file_type)
        else:
            # Fallback or unknown
            records = [{"content": "unknown format", "type": "unknown"}]

        job.progress.total_items = len(records)
        job.progress.percent = 30
        job.progress.message = f"Знайдено {len(records)} записів"

        # Phase 2.5: Entity Resolution (UEID) & Data Fusion Persistence
        job.progress.stage = "entity_resolution"
        job.progress.message = "Резолюція суб'єктів (UEID)..."
        job.updated_at = datetime.utcnow()

        import hashlib

        from app.core.signal_bus import SignalBus
        from app.libs.core.database import get_db_ctx
        from app.models.v55.signal import SignalLayer, SignalPriority, V55Signal
        from app.repositories.entity_repository import EntityRepository
        from app.repositories.fused_record_repository import FusedRecordRepository

        unique_ueids = set()

        if file_type in [".xlsx", ".xls", ".csv"] and records:
            async with get_db_ctx() as db:
                repo = EntityRepository(db)
                fused_repo = FusedRecordRepository(db)
                bus = SignalBus.get_instance()

                for i, record in enumerate(records):
                    # Try to extract company name and edrpou from common column names
                    name = str(record.get("company_name") or record.get("name") or record.get("declarant_name") or "Unknown Entity")
                    edrpou = record.get("edrpou") or record.get("inn")

                    if edrpou:
                        # Clean up numeric representation or float parsing errors
                        try:
                            edrpou_str = str(int(float(edrpou)))
                            edrpou = edrpou_str.zfill(8) if len(edrpou_str) <= 8 else edrpou_str
                        except (ValueError, TypeError):
                            edrpou = str(edrpou).strip()

                    entity, _is_new = await repo.resolve_or_create(
                        name=name,
                        entity_type="company",
                        edrpou=edrpou,
                        metadata={"source_file": filename}
                    )

                    record["ueid"] = str(entity.ueid)
                    unique_ueids.add(str(entity.ueid))

                    # Store FusedRecord for engines
                    fprint = hashlib.md5(str(record).encode("utf-8")).hexdigest()
                    await fused_repo.save_record(
                        ueid=entity.ueid,
                        source="file_upload",
                        raw_data=record,
                        normalized_data={},
                        fingerprint=fprint,
                        quality_score=0.75,
                    )

                    if i % 100 == 0:
                        job.progress.current_item = i
                        job.progress.message = f"Резолюція UEID: {i}/{len(records)}"
                        await db.flush()

                await db.commit()

                # Pre-emit `data.ingested` signals
                for u in unique_ueids:
                    sig = V55Signal(
                        signal_type="DATA_INGESTED",
                        topic="data.ingested",
                        ueid=u,
                        layer=SignalLayer.BEHAVIORAL,
                        priority=SignalPriority.ROUTINE,
                        score=0.0,
                        confidence=1.0,
                        summary=f"New data ingested from {filename}"
                    )
                    await bus.emit(sig, session=db)

                await db.commit()

        # Phase 3: Chunking
        job.status = IngestionStatus.CHUNKING
        job.progress.stage = "chunking"
        job.progress.message = "Підготовка даних..."
        job.updated_at = datetime.utcnow()

        chunks = await service.create_chunks(records)
        job.progress.percent = 40

        # Phase 4: Embedding
        job.status = IngestionStatus.EMBEDDING
        job.progress.stage = "embedding"
        job.updated_at = datetime.utcnow()

        total_chunks = len(chunks)
        for i, chunk in enumerate(chunks):
            job.progress.current_item = i + 1
            # Scale progress from 40% to 70%
            job.progress.percent = 40 + ((i + 1) / total_chunks) * 30
            job.progress.message = f"Створення embeddings: {i + 1}/{total_chunks}"

            await service.create_embedding(chunk)

        # Phase 5: Indexing
        job.status = IngestionStatus.INDEXING
        job.progress.stage = "indexing"
        job.updated_at = datetime.utcnow()

        for i, chunk in enumerate(chunks):
            job.progress.current_item = i + 1
            # Scale progress from 70% to 95%
            job.progress.percent = 70 + ((i + 1) / total_chunks) * 25
            job.progress.message = f"Індексація даних: {i + 1}/{total_chunks}"

            await service.index_chunk(chunk)

        # Phase 6: Finalizing
        job.progress.stage = "finalizing"
        job.progress.message = "Збереження метаданих..."
        job.updated_at = datetime.utcnow()

        await service.save_dataset_metadata(job_id, filename, len(records), user_id, dataset_name)

        job.status = IngestionStatus.READY
        job.progress.stage = "ready"
        job.progress.percent = 100
        job.progress.message = f"Успішно оброблено {len(records)} записів"
        job.updated_at = datetime.utcnow()

    except Exception as e:
        logger.exception(f"Ingestion failed for job {job_id}")
        job.status = IngestionStatus.FAILED
        job.progress.stage = "failed"
        job.error = str(e)
        job.progress.message = f"Помилка: {e!s}"
        job.updated_at = datetime.utcnow()


async def process_telegram_async(job_id: str, url: str, limit: int, user_id: str, config: dict):
    """Background task to process Telegram channel with Telethon."""
    job = ingestion_jobs.get(job_id)
    if not job:
        return

    pipeline = get_telegram_pipeline()

    try:
        # Phase 1: Authentication & Connection
        job.status = IngestionStatus.VALIDATING
        job.progress.stage = "AUTH"
        job.progress.message = "Підключення до Telegram API..."
        job.updated_at = datetime.utcnow()

        # Extract username from URL
        username = url.rsplit("/", maxsplit=1)[-1].replace("@", "")

        # Phase 2: Fetching
        job.status = IngestionStatus.PARSING
        job.progress.stage = "FETCH"
        job.progress.message = f"Отримання історії каналу @{username}..."
        job.updated_at = datetime.utcnow()
        await asyncio.sleep(0.5)

        # Get history via Telethon connector
        # Note: In a real app, we'd ensure the connector is initialized with valid session
        result = await telegram_channel_connector.fetch_channel_history(username, limit=limit)

        if not result.success:
            raise ValueError(f"Telethon error: {result.error}")

        messages = result.data
        job.progress.total_items = len(messages)
        job.progress.percent = 30
        job.progress.message = f"Знайдено {len(messages)} повідомлень"

        # Phase 3: Processing & Enrichment
        job.status = IngestionStatus.EMBEDDING
        job.progress.stage = "PARSE"
        job.updated_at = datetime.utcnow()

        processed_count = 0
        for i, msg in enumerate(messages):
            job.progress.current_item = i + 1
            job.progress.percent = 30 + ((i + 1) / len(messages)) * 60
            job.progress.message = f"Обробка повідомлень: {i + 1}/{len(messages)}"

            # Process via Intelligence Pipeline
            # We pass a simplified message dict or the raw one if compat
            await pipeline.process_message(msg, {"name": username})

            # Simulated indexing for now as in process_file_async
            processed_count += 1
            if i % 10 == 0:
                await asyncio.sleep(0.1)  # Yield to event loop

        # Phase 4: Finalizing
        job.status = IngestionStatus.READY
        job.progress.stage = "READY"
        job.progress.percent = 100
        job.progress.message = f"Успішно оброблено {processed_count} повідомлень з @{username}"
        job.updated_at = datetime.utcnow()

    except Exception as e:
        logger.exception(f"Telegram ingestion failed for job {job_id}")
        job.status = IngestionStatus.FAILED
        job.progress.stage = "failed"
        job.error = str(e)
        job.progress.message = f"Помилка: {e!s}"
        job.updated_at = datetime.utcnow()


@router.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


@router.post("/upload", response_model=IngestionResponse)
async def upload_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    dataset_name: str | None = None,
    current_user=Depends(get_current_user),
):
    """Upload file for ingestion with background processing."""
    allowed_extensions = {".xlsx", ".xls", ".csv", ".pdf", ".docx", ".doc", ".txt", ".json"}
    file_ext = "." + file.filename.split(".")[-1].lower() if "." in file.filename else ""

    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format. Allowed: {', '.join(allowed_extensions)}",
        )

    # Read content (In prod: stream to disk/S3 for large files)
    try:
        content = await file.read()
    except Exception:
        raise HTTPException(status_code=400, detail="Failed to read file")

    # Limit size (e.g. 500MB)
    if len(content) > 500 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 500MB)")

    job_id = str(uuid.uuid4())
    job = IngestionJob(
        id=job_id,
        filename=file.filename,
        file_size=len(content),
        file_type=file_ext,
        status=IngestionStatus.UPLOADING,
        user_id=getattr(current_user, "id", "anonymous"),
        created_at=datetime.utcnow(),
        progress=IngestionProgress(stage="queued", percent=0, message="Файл в черзі на обробку"),
    )

    ingestion_jobs[job_id] = job

    # Start background processing
    background_tasks.add_task(
        process_file_async,
        job_id=job_id,
        content=content,
        filename=file.filename,
        file_type=file_ext,
        user_id=getattr(current_user, "id", "anonymous"),
        dataset_name=dataset_name,
    )

    return IngestionResponse(
        job_id=job_id,
        status=IngestionStatus.UPLOADING,
        message="Файл прийнято до обробки",
        status_url=f"/api/v1/ingest/status/{job_id}",
        stream_url=f"/api/v1/ingest/stream/{job_id}",
    )


@router.post("/telegram", response_model=dict)
async def ingest_telegram(
    request: TelegramIngestRequest,
    background_tasks: BackgroundTasks,
    current_user=Depends(get_current_user),
):
    """Initiate Telegram channel parsing."""
    job_id = str(uuid.uuid4())
    job = IngestionJob(
        id=job_id,
        filename=f"telegram_{request.url.split('/')[-1]}",
        file_size=0,
        file_type="telegram",
        status=IngestionStatus.UPLOADING,
        user_id=getattr(current_user, "id", "anonymous"),
        created_at=datetime.utcnow(),
        progress=IngestionProgress(
            stage="CREATED", percent=0, message="Запит на парсинг Telegram прийнято"
        ),
    )

    ingestion_jobs[job_id] = job

    # Start background task
    background_tasks.add_task(
        process_telegram_async,
        job_id=job_id,
        url=request.url,
        limit=request.limit,
        user_id=getattr(current_user, "id", "anonymous"),
        config={"name": request.name, "sector": request.sector},
    )

    return {
        "status": "success",
        "job_id": job_id,
        "source_id": job_id,  # Frontend compat
        "message": "Парсинг розпочато",
    }


@router.get("/jobs")
async def list_jobs():
    """List all active and recent ingestion jobs."""
    jobs_list = []
    for job_id, job in ingestion_jobs.items():
        jobs_list.append(
            {
                "job_id": job_id,
                "source_file": job.filename,
                "state": job.status.value,
                "display_name": getattr(job, "display_name", job.filename),
                "progress": {
                    "percent": job.progress.percent,
                    "records_processed": job.progress.current_item,
                    "records_total": job.progress.total_items,
                },
                "timestamps": {
                    "created_at": job.created_at.isoformat()
                    if job.created_at
                    else datetime.utcnow().isoformat(),
                    "updated_at": job.updated_at.isoformat()
                    if hasattr(job, "updated_at") and job.updated_at
                    else datetime.utcnow().isoformat(),
                },
            }
        )

    # Sort by created_at descending
    jobs_list.sort(key=lambda x: x["timestamps"]["created_at"], reverse=True)
    return {"jobs": jobs_list}


@router.get("/status/{job_id}")
async def get_status(job_id: str):
    """Poll handling status."""
    job = ingestion_jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.get("/stream/{job_id}")
async def stream_progress(job_id: str):
    """Server-Sent Events (SSE) for real-time progress updates."""
    if job_id not in ingestion_jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    async def event_generator():
        last_percent = -1.0
        last_stage = ""

        while True:
            job = ingestion_jobs.get(job_id)
            if not job:
                yield f"data: {json.dumps({'status': 'not_found'})}\n\n"
                break

            # Send update if changed or every 2 seconds heartbeat
            if job.progress.percent != last_percent or job.progress.stage != last_stage:
                last_percent = job.progress.percent
                last_stage = job.progress.stage

                data = {
                    "status": job.status.value,
                    "stage": job.progress.stage,
                    "percent": round(job.progress.percent, 1),
                    "current": job.progress.current_item,
                    "total": job.progress.total_items,
                    "message": job.progress.message,
                    "error": job.error,
                }
                yield f"data: {json.dumps(data)}\n\n"

            if job.status in [IngestionStatus.READY, IngestionStatus.FAILED]:
                # Send one final update to be sure
                data = {
                    "status": job.status.value,
                    "stage": job.progress.stage,
                    "percent": 100 if job.status == IngestionStatus.READY else job.progress.percent,
                    "message": job.progress.message,
                    "error": job.error,
                }
                yield f"data: {json.dumps(data)}\n\n"
                break

            await asyncio.sleep(0.5)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )
