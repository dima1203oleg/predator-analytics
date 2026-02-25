from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from typing import Dict, Any, List, Optional
import os
import uuid
import tempfile
import pandas as pd
from datetime import datetime
import logging

from app.services.minio_service import minio_service
from app.services.kafka_service import kafka_service
from app.services.etl_service import etl_service
from app.services.indexing_service import indexing_service
from app.services.document_service import document_service
from app.models import Document
from libs.core.database import async_session_maker
from libs.core.logger import setup_logger

logger = setup_logger("predator.api.ingestion")

router = APIRouter(prefix="/ingestion", tags=["ingestion"])

@router.post("/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    dataset_type: str = "custom",
    background_tasks: BackgroundTasks = None
):
    """
    V25 Canonical Ingestion Engine.
    Handles high-speed upload, MinIO archiving, Kafka event signaling,
    ETL processing, and Vector Indexing in one atomic-like flow.
    """
    logger.info(f"🚀 Starting ingestion for file: {file.filename} (Type: {dataset_type})")
    
    # 1. Save to temp file
    suffix = os.path.splitext(file.filename)[1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
        content = await file.read()
        temp_file.write(content)
        temp_path = temp_file.name

    try:
        # 2. Archive to MinIO (Bronze Layer)
        object_name = f"{dataset_type}/{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
        await minio_service.upload_file("raw-data", object_name, temp_path)
        logger.info(f"📦 Archived to MinIO: raw-data/{object_name}")

        # 3. Signal Kafka (Eventual Consistency Flow)
        await kafka_service.send_message("ingestion_events", {
            "action": "file_uploaded",
            "filename": file.filename,
            "minio_path": f"raw-data/{object_name}",
            "dataset_type": dataset_type,
            "timestamp": datetime.utcnow().isoformat()
        })

        # 4. ETL Processing (Silver Layer)
        etl_result = await etl_service.process_file(temp_path, dataset_type)
        if not etl_result.get("success"):
            raise HTTPException(status_code=400, detail=f"ETL failed: {etl_result.get('error')}")

        documents = etl_result.get("documents", [])
        
        # 5. Vector Indexing (Semantic Layer)
        indexing_result = await indexing_service.index_documents(documents, dataset_type)

        # 6. Populate Gold Layer (PostgreSQL)
        async with async_session_maker() as session:
            for doc_data in documents:
                # Clean meta
                clean_meta = {k: (str(v) if isinstance(v, (pd.Timestamp, datetime, uuid.UUID)) else v) 
                             for k, v in doc_data.items()}

                doc = Document(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID("00000000-0000-0000-0000-000000000000"),
                    title=f"{dataset_type.capitalize()} Entry: {doc_data.get('decl_number', 'Unknown')}",
                    content=doc_data.get('description', str(doc_data)),
                    source_type=dataset_type,
                    meta=clean_meta
                )
                session.add(doc)
            await session.commit()
            logger.info(f"✅ Promoted {len(documents)} docs to Gold Layer (PostgreSQL)")

        return {
            "status": "success",
            "file": file.filename,
            "minio_path": f"raw-data/{object_name}",
            "etl": {k: v for k, v in etl_result.items() if k != "documents"},
            "indexing": indexing_result,
            "message": "File processed successfully"
        }

    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_path):
            os.unlink(temp_path)
