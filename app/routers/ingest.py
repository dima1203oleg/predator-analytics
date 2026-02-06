import logging
import uuid
import json
import asyncio
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Depends
from fastapi.responses import StreamingResponse

from app.models.ingestion import (
    IngestionJob,
    IngestionStatus,
    IngestionProgress,
    ChunkUploadRequest,
    IngestionResponse
)
from app.services.ingestion_service import IngestionService
# In a real app, use a real auth dependency. Mocking for now if file doesn't exist
try:
    from app.core.security import get_current_user
except ImportError:
    async def get_current_user(): return type('User', (), {'id': 'mock-user-id'})

router = APIRouter(prefix="/v1/ingestion", tags=["ingestion"])
logger = logging.getLogger(__name__)

# In-memory storage for jobs (Use Redis in production)
ingestion_jobs: dict = {}

async def process_file_async(
    job_id: str,
    content: bytes,
    filename: str,
    file_type: str,
    user_id: str,
    dataset_name: Optional[str]
):
    """
    Background task to process file with granular progress updates.
    """
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
        await asyncio.sleep(0.5) # UX feel

        await service.validate_file(content, file_type)
        job.progress.percent = 10

        # Phase 2: Parsing
        job.status = IngestionStatus.PARSING
        job.progress.stage = "parsing"
        job.progress.message = "Читання та парсинг даних..."
        job.updated_at = datetime.utcnow()

        records = []
        if file_type in ['.xlsx', '.xls', '.csv']:
            records = await service.parse_excel(content, filename)
        elif file_type == '.pdf':
            records = await service.parse_pdf(content)
        elif file_type in ['.docx', '.doc', '.txt']:
            records = await service.parse_document(content, file_type)
        else:
            # Fallback or unknown
            records = [{"content": "unknown format", "type": "unknown"}]

        job.progress.total_items = len(records)
        job.progress.percent = 30
        job.progress.message = f"Знайдено {len(records)} записів"

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
            job.progress.message = f"Створення embeddings: {i+1}/{total_chunks}"

            await service.create_embedding(chunk)

        # Phase 5: Indexing
        job.status = IngestionStatus.INDEXING
        job.progress.stage = "indexing"
        job.updated_at = datetime.utcnow()

        for i, chunk in enumerate(chunks):
            job.progress.current_item = i + 1
            # Scale progress from 70% to 95%
            job.progress.percent = 70 + ((i + 1) / total_chunks) * 25
            job.progress.message = f"Індексація даних: {i+1}/{total_chunks}"

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
        job.progress.message = f"Помилка: {str(e)}"
        job.updated_at = datetime.utcnow()


@router.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@router.post("/upload", response_model=IngestionResponse)
async def upload_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    dataset_name: Optional[str] = None,
    current_user = Depends(get_current_user)
):
    """
    Upload file for ingestion with background processing.
    """
    allowed_extensions = {'.xlsx', '.xls', '.csv', '.pdf', '.docx', '.doc', '.txt', '.json'}
    file_ext = '.' + file.filename.split('.')[-1].lower() if '.' in file.filename else ''

    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format. Allowed: {', '.join(allowed_extensions)}"
        )

    # Read content (In prod: stream to disk/S3 for large files)
    try:
        content = await file.read()
    except Exception as e:
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
        user_id=getattr(current_user, 'id', 'anonymous'),
        created_at=datetime.utcnow(),
        progress=IngestionProgress(
            stage="queued",
            percent=0,
            message="Файл в черзі на обробку"
        )
    )

    ingestion_jobs[job_id] = job

    # Start background processing
    background_tasks.add_task(
        process_file_async,
        job_id=job_id,
        content=content,
        filename=file.filename,
        file_type=file_ext,
        user_id=getattr(current_user, 'id', 'anonymous'),
        dataset_name=dataset_name
    )

    return IngestionResponse(
        job_id=job_id,
        status=IngestionStatus.UPLOADING,
        message="Файл прийнято до обробки",
        status_url=f"/api/v1/ingestion/status/{job_id}",
        stream_url=f"/api/v1/ingestion/stream/{job_id}"
    )

@router.get("/status/{job_id}")
async def get_status(job_id: str):
    """
    Poll handling status.
    """
    job = ingestion_jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.get("/stream/{job_id}")
async def stream_progress(job_id: str):
    """
    Server-Sent Events (SSE) for real-time progress updates.
    """
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
                    "error": job.error
                }
                yield f"data: {json.dumps(data)}\n\n"

            if job.status in [IngestionStatus.READY, IngestionStatus.FAILED]:
                # Send one final update to be sure
                data = {
                    "status": job.status.value,
                    "stage": job.progress.stage,
                    "percent": 100 if job.status == IngestionStatus.READY else job.progress.percent,
                    "message": job.progress.message,
                    "error": job.error
                }
                yield f"data: {json.dumps(data)}\n\n"
                break

            await asyncio.sleep(0.5)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
        }
    )
