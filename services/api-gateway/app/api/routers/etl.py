"""ETL Router - Predator Analytics v25.0"""
from fastapi import APIRouter, HTTPException, UploadFile, File
from app.services.etl_ingestion import ETLIngestionService
import logging

logger = logging.getLogger("api.etl")
router = APIRouter(prefix="/etl", tags=["ETL"])
etl_service = ETLIngestionService()

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
                    "progress": j.progress,
                    "created_at": j.created_at,
                    "updated_at": j.updated_at,
                    "errors": j.errors
                }
                for j in jobs
            ]
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
