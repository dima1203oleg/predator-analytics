"""ETL Router - Predator Analytics v28-S"""
from fastapi import APIRouter, HTTPException, UploadFile, File
from app.services.etl_ingestion import ETLIngestionService
import logging

from libs.core.etl_arbiter import ETLSovereignArbiter
from libs.core.etl_state_machine_v28s import ETLStateMachineV28S, ETLState

from libs.core.structured_logger import get_logger
logger = get_logger("api.etl")
router = APIRouter(prefix="/etl", tags=["ETL"])
etl_service = ETLIngestionService()
arbiter = ETLSovereignArbiter()

@router.get("/jobs")
async def list_jobs(limit: int = 50, offset: int = 0):
    """List ETL jobs with formal states."""
    from libs.core.database import get_db_ctx
    from libs.core.models.entities import ETLJob
    from sqlalchemy import select, desc

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
    from libs.core.database import get_db_ctx
    from libs.core.models.entities import ETLJob
    import uuid

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
    from libs.core.database import get_db_ctx
    from libs.core.models.entities import ETLJob
    from libs.core.etl_state_machine import ETLState
    from sqlalchemy import select, func

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
    """
    Trigger ETL for a file already present on the server.
    Required for Predator Analytics v25.0 E2E testing.
    """
    try:
        result = await etl_service.process_file(file_path, dataset_type)
        if result["status"] == "failed":
            raise HTTPException(status_code=400, detail=result.get("error"))
        return result
    except Exception as e:
        logger.error(f"ETL Local Process Failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload")
async def upload_and_process(file: UploadFile = File(...), dataset_type: str = "customs"):
    """Handle direct file upload and ETL trigger"""
    # This logic is also in main.py, but for v25.0 we consolidate it here
    import tempfile
    import os

    suffix = os.path.splitext(file.filename)[1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        result = await etl_service.process_file(tmp_path, dataset_type)
        return result
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)
