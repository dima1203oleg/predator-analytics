import contextlib
from datetime import datetime
import os
import tempfile
from typing import Any
import uuid

from fastapi import APIRouter, BackgroundTasks, File, HTTPException, UploadFile
import pandas as pd

from app.models import Document
from app.services.etl_service import etl_service
from app.services.indexing_service import indexing_service
from app.services.kafka_service import kafka_service
from app.services.minio_service import minio_service
from libs.core.database import async_session_maker
from libs.core.logger import setup_logger


logger = setup_logger("predator.api.ingestion")

router = APIRouter(prefix="/ingest", tags=["ingestion"])

# In-memory job state (In production, this should be in Redis/PostgreSQL)
GLOBAL_JOBS: dict[str, dict[str, Any]] = {}


async def process_dataset_task(job_id: str, file_path: str, filename: str, dataset_type: str):
    """Background task to process dataset with status updates."""
    job = GLOBAL_JOBS.get(job_id)
    if not job:
        return

    try:
        # Phase 1: Archive to MinIO (Bronze Layer)
        job["state"] = "ARCHIVING"
        job["progress"]["stage"] = "archiving"
        job["progress"]["percent"] = 10

        object_name = f"{dataset_type}/{datetime.now().strftime('%Y%m%d_%H%M%S')}_{filename}"
        await minio_service.upload_file("raw-data", object_name, file_path)
        job["minio_path"] = f"raw-data/{object_name}"
        logger.info(f"📦 Archived to MinIO: raw-data/{object_name}")

        # Phase 2: Signal Kafka (Eventual Consistency Flow) - PRE-ETL
        job["state"] = "STAGING"
        job["progress"]["stage"] = "kafka_signal"
        job["progress"]["percent"] = 20
        await kafka_service.send_message(
            "ingestion_events",
            {
                "action": "file_uploaded",
                "job_id": job_id,
                "filename": filename,
                "minio_path": job["minio_path"],
                "dataset_type": dataset_type,
                "timestamp": datetime.utcnow().isoformat(),
            },
        )

        # Phase 3: ETL Processing (Silver Layer)
        job["state"] = "PROCESSING"
        job["progress"]["stage"] = "etl"
        job["progress"]["percent"] = 30

        etl_result = await etl_service.process_file(file_path, dataset_type)
        if not etl_result.get("success"):
            raise Exception(f"ETL failed: {etl_result.get('error')}")

        documents = etl_result.get("documents", [])
        job["progress"]["records_total"] = len(documents)
        job["progress"]["records_processed"] = len(documents)
        job["progress"]["percent"] = 60

        # Phase 4: Vector Indexing (Semantic Layer)
        job["state"] = "INDEXING"
        job["progress"]["stage"] = "indexing"
        indexing_result = await indexing_service.index_documents(documents, dataset_type)
        job["progress"]["records_indexed"] = indexing_result.get("indexed", 0)
        job["progress"]["percent"] = 80

        # Phase 5: Populate Gold Layer (PostgreSQL)
        job["state"] = "PROMOTING"
        job["progress"]["stage"] = "promotion"
        async with async_session_maker() as session:
            for doc_data in documents:
                # Clean meta
                clean_meta = {
                    k: (str(v) if isinstance(v, (pd.Timestamp, datetime, uuid.UUID)) else v)
                    for k, v in doc_data.items()
                }

                doc = Document(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID("00000000-0000-0000-0000-000000000000"),
                    title=f"{dataset_type.capitalize()} Entry: {doc_data.get('decl_number', 'Unknown')}",
                    content=doc_data.get("description", str(doc_data)),
                    source_type=dataset_type,
                    meta=clean_meta,
                )
                session.add(doc)
            await session.commit()
            logger.info(f"✅ Promoted {len(documents)} docs to Gold Layer (PostgreSQL)")

        job["state"] = "COMPLETED"
        job["progress"]["percent"] = 100
        job["progress"]["stage"] = "finished"
        job["updated_at"] = datetime.utcnow().isoformat()

    except Exception as e:
        logger.exception(f"Job {job_id} failed: {e}")
        job["state"] = "FAILED"
        job["error"] = str(e)
        job["progress"]["stage"] = "error"
        job["updated_at"] = datetime.utcnow().isoformat()
    finally:
        if os.path.exists(file_path):
            with contextlib.suppress(BaseException):
                os.unlink(file_path)


@router.post("/upload")
async def upload_dataset(
    background_tasks: BackgroundTasks, file: UploadFile = File(...), dataset_type: str = "custom"
):
    """V45 Improved Ingestion Engine.
    Initiates asynchronous processing and returns a Job ID immediately.
    """
    job_id = str(uuid.uuid4())
    logger.info(f"🚀 Received upload: {file.filename} -> Job {job_id}")

    # Save to temp file
    suffix = os.path.splitext(file.filename)[1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
        content = await file.read()
        temp_file.write(content)
        temp_path = temp_file.name

    # Initialize job tracking
    GLOBAL_JOBS[job_id] = {
        "job_id": job_id,
        "source_file": file.filename,
        "state": "CREATED",
        "progress": {
            "percent": 0,
            "stage": "queued",
            "records_processed": 0,
            "records_total": 0,
            "records_indexed": 0,
        },
        "timestamps": {
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        },
        "errors": [],
    }

    # Start background process
    background_tasks.add_task(
        process_dataset_task,
        job_id=job_id,
        file_path=temp_path,
        filename=file.filename,
        dataset_type=dataset_type,
    )

    return {"status": "success", "job_id": job_id, "message": "Ingestion initiated successfully"}


@router.get("/jobs")
async def list_jobs(limit: int = 20):
    """List active and recent ingestion jobs."""
    jobs_list = sorted(
        GLOBAL_JOBS.values(), key=lambda x: x["timestamps"]["created_at"], reverse=True
    )
    return {"jobs": jobs_list[:limit]}


@router.get("/status/{job_id}")
async def get_job_status(job_id: str):
    """Get detailed status for a specific job."""
    job = GLOBAL_JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.post("/telegram")
async def ingest_telegram(background_tasks: BackgroundTasks, request: dict[str, Any]):
    """Trigger Telegram ingestion (Mock for now)."""
    job_id = str(uuid.uuid4())
    url = request.get("url")
    name = request.get("name", url.split("/")[-1] if url else "Unknown Telegram")

    GLOBAL_JOBS[job_id] = {
        "job_id": job_id,
        "source_file": f"telegram://{name}",
        "state": "CREATED",
        "progress": {"percent": 0, "stage": "queued", "records_processed": 0, "records_total": 0},
        "timestamps": {
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        },
    }

    # Mock some progress in a task
    async def mock_tg_task(jid):
        try:
            GLOBAL_JOBS[jid]["state"] = "PROCESSING"
            for i in range(1, 11):
                await asyncio.sleep(1)
                GLOBAL_JOBS[jid]["progress"]["percent"] = i * 10
                GLOBAL_JOBS[jid]["progress"]["records_processed"] = i * 5
                GLOBAL_JOBS[jid]["progress"]["records_total"] = 50
            GLOBAL_JOBS[jid]["state"] = "COMPLETED"
        except:
            GLOBAL_JOBS[jid]["state"] = "FAILED"

    import asyncio

    background_tasks.add_task(mock_tg_task, job_id)

    return {"status": "success", "job_id": job_id}
