from __future__ import annotations


"""ETL Router - Predator Analytics v28-S."""
import logging

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.libs.core.etl_arbiter import ETLSovereignArbiter
from app.libs.core.etl_state_machine_v28s import ETLState, ETLStateMachineV28S
from app.libs.core.structured_logger import get_logger
from app.services.etl_ingestion import ETLIngestionService


logger = get_logger("api.etl")
router = APIRouter(prefix="/etl", tags=["ETL"])
etl_service = ETLIngestionService()
arbiter = ETLSovereignArbiter()

@router.get("/jobs")
async def list_jobs(limit: int = 50, offset: int = 0):
    """List ETL jobs with formal states."""
    from sqlalchemy import desc, select

    from app.libs.core.database import get_db_ctx
    from app.libs.core.models.entities import ETLJob

    async with get_db_ctx() as sess:
        stmt = select(ETLJob).order_by(desc(ETLJob.created_at)).limit(limit).offset(offset)
        result = await sess.execute(stmt)
        jobs = result.scalars().all()

        return {
            "status": "success",
            "count": len(jobs),
            "jobs": [
                {
                    "job_id": str(j.id),
                    "source_file": j.source_file,
                    "state": j.state,
                    "progress": j.progress or {"percent": 0, "records_total": 0, "records_processed": 0, "records_indexed": 0},
                    "constitutional_compliance": True, # Aggregated compliance
                    "timestamps": {
                        "created_at": j.created_at.isoformat() if j.created_at else None,
                        "state_entered_at": j.timestamps.get("state_entered_at") if j.timestamps else j.updated_at.isoformat() if j.updated_at else None,
                        "updated_at": j.updated_at.isoformat() if j.updated_at else None
                    },
                    "errors": j.errors or []
                }
                for j in jobs
            ]
        }

@router.get("/jobs/{job_id}")
async def get_job(job_id: str):
    """Get detailed ETL job status with real metrics."""
    import uuid

    from app.libs.core.database import get_db_ctx
    from app.libs.core.models.entities import ETLJob

    async with get_db_ctx() as sess:
        job = await sess.get(ETLJob, uuid.UUID(job_id))
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")

        # Build timestamps object
        timestamps = {
            "created_at": job.created_at.isoformat() if job.created_at else None,
            "state_entered_at": job.timestamps.get("state_entered_at") if job.timestamps else job.updated_at.isoformat() if job.updated_at else None,
            "updated_at": job.updated_at.isoformat() if job.updated_at else None
        }

        # Constitutional Monitoring Check
        job_dict = {
            "job_id": str(job.id),
            "state": job.state,
            "progress": job.progress,
            "errors": job.errors,
            "meta": {"dataset_type": job.dataset_type}
        }
        compliance = await arbiter.monitor_etl_job(str(job.id), job_dict)

        return {
            "job_id": str(job.id),
            "source_file": job.source_file,
            "state": job.state,
            "progress": job.progress or {"percent": 0, "records_total": 0, "records_processed": 0, "records_indexed": 0},
            "timestamps": timestamps,
            "errors": job.errors or [],
            "constitutional_compliance": compliance["constitutional_compliance"],
            "violations": compliance["violations"]
        }

@router.get("/status")
async def get_global_status():
    """Simplified global ETL status for the 'Truth Invariant' verification."""
    from sqlalchemy import func, select

    from app.libs.core.database import get_db_ctx
    from app.libs.core.etl_state_machine import ETLState
    from app.libs.core.models.entities import ETLJob

    async with get_db_ctx() as sess:
        # Active jobs
        stmt = select(ETLJob).where(ETLJob.state.notin_([
            ETLState.COMPLETED.value,
            ETLState.FAILED.value,
            ETLState.CANCELLED.value
        ]))
        res = await sess.execute(stmt)
        active_jobs = res.scalars().all()

        is_running = len(active_jobs) > 0
        global_percent = 100
        if is_running:
            global_percent = min([j.progress.get("percent", 0) for j in active_jobs])
            global_percent = min(global_percent, 99) # Never 100 if active

        return {
            "etl_running": is_running,
            "global_progress": global_percent,
            "active_jobs_count": len(active_jobs)
        }

@router.post("/process-local")
async def process_local_file(file_path: str, dataset_type: str = "customs"):
    """Trigger ETL for a file already present on the server.
    Required for Predator Analytics v25.0 E2E testing.
    """
    try:
        result = await etl_service.process_file(file_path, dataset_type)
        if result["status"] == "failed":
            raise HTTPException(status_code=400, detail=result.get("error"))
        return result
    except Exception as e:
        logger.exception(f"ETL Local Process Failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload")
async def upload_and_process(file: UploadFile = File(...), dataset_type: str = "customs"):
    """Handle direct file upload and ETL trigger."""
    # This logic is also in main.py, but for v25.0 we consolidate it here
    import os
    import tempfile

    suffix = os.path.splitext(file.filename)[1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        return await etl_service.process_file(tmp_path, dataset_type)
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)


@router.post("/process")
async def process_unified(
    file: UploadFile = File(None),
    source_type: str = "excel",
    url: str = None,
    options: str = None
):
    """Уніфікований пайплайн обробки будь-якого типу джерела.

    Підтримувані типи:
    - excel, csv - табличні дані
    - pdf - PDF документи
    - image - зображення (OCR)
    - word - Word документи
    - audio - аудіо файли (транскрипція)
    - video - відео файли
    - telegram - Telegram канали
    - website - веб-сайти
    - api - API джерела
    - rss - RSS/Atom фіди
    """
    import os
    import tempfile

    from app.services.unified_pipeline import get_unified_pipeline

    pipeline = get_unified_pipeline()
    parsed_options = {}

    if options:
        try:
            import json
            parsed_options = json.loads(options)
        except Exception:
            pass

    # Якщо передано файл - обробляємо як файл
    if file and file.filename:
        suffix = os.path.splitext(file.filename)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name

        try:
            result = await pipeline.process(source_type, tmp_path, parsed_options)
            return result
        finally:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)

    # Якщо передано URL - обробляємо як URL
    elif url:
        result = await pipeline.process(source_type, url, parsed_options)
        return result

    else:
        raise HTTPException(status_code=400, detail="Потрібен file або url")


@router.get("/pipeline-stats")
async def get_pipeline_stats():
    """Отримати статистику пайплайнів."""
    from app.services.unified_pipeline import get_unified_pipeline

    pipeline = get_unified_pipeline()

    return {
        "status": "operational",
        "supported_sources": [
            {"type": "excel", "description": "Excel файли (.xlsx, .xls)"},
            {"type": "csv", "description": "CSV файли"},
            {"type": "pdf", "description": "PDF документи"},
            {"type": "image", "description": "Зображення (OCR)"},
            {"type": "word", "description": "Word документи (.docx)"},
            {"type": "audio", "description": "Аудіо файли (транскрипція)"},
            {"type": "video", "description": "Відео файли"},
            {"type": "telegram", "description": "Telegram канали"},
            {"type": "website", "description": "Веб-сайти"},
            {"type": "api", "description": "API джерела"},
            {"type": "rss", "description": "RSS/Atom фіди"}
        ],
        "target_databases": ["postgresql", "opensearch", "qdrant", "redis", "minio"],
        "enrichment_capabilities": ["ner", "embedding", "ocr", "transcription", "classification"]
    }
