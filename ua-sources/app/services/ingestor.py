"""
Ingestor Service - Data ingestion pipeline
Handles bulk data import from various sources into Qdrant Vector DB
"""
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from datetime import datetime, timezone
from enum import Enum
import asyncio
import logging
import uuid
import csv
import os

from .qdrant_service import get_qdrant_service
from .embedding_service import get_embedding_service

logger = logging.getLogger(__name__)


class IngestionStatus(Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


@dataclass
class IngestionJob:
    id: str
    source: str
    status: IngestionStatus
    records_total: int
    records_processed: int
    records_failed: int
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    error: Optional[str]


class IngestorService:
    """
    Data Ingestion Service
    Manages bulk data import from external sources into Qdrant
    """
    
    def __init__(self):
        self.active_jobs: Dict[str, IngestionJob] = {}
        self.batch_size = 50
    
    async def ingest_csv(self, file_path: str) -> IngestionJob:
        """
        Start ingestion from a CSV file.
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
            
        # Read CSV immediately to get record count (could be optimized for huge files)
        records = []
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                reader = csv.DictReader(f)
                records = list(reader)
        except Exception as e:
            raise ValueError(f"Failed to parse CSV: {e}")

        return await self.start_ingestion(
            source=f"csv:{os.path.basename(file_path)}",
            config={"records": records}
        )

    async def start_ingestion(
        self,
        source: str,
        config: Dict[str, Any]
    ) -> IngestionJob:
        """
        Start a new ingestion job
        
        Args:
            source: Data source identifier
            config: Source-specific configuration (must contain 'records' list)
        """
        job_id = str(uuid.uuid4())[:8]
        records = config.get("records", [])
        
        job = IngestionJob(
            id=job_id,
            source=source,
            status=IngestionStatus.PENDING,
            records_total=len(records),
            records_processed=0,
            records_failed=0,
            started_at=None,
            completed_at=None,
            error=None
        )
        
        self.active_jobs[job_id] = job
        
        # Start processing in background
        asyncio.create_task(self._process_job(job_id, records))
        
        return job
    
    async def _process_job(self, job_id: str, records: List[Dict]):
        """Process ingestion job"""
        job = self.active_jobs.get(job_id)
        if not job:
            return
        
        job.status = IngestionStatus.RUNNING
        job.started_at = datetime.now(timezone.utc)
        logger.info(f"Starting ingestion job {job_id}: {len(records)} records")
        
        qdrant = get_qdrant_service()
        # Ensure collection exists
        await qdrant.create_collection()
        
        try:
            # Chunking for batch efficiency
            chunk = []
            
            for i, record in enumerate(records):
                chunk.append(record)
                
                if len(chunk) >= self.batch_size or i == len(records) - 1:
                    try:
                        # Optimization: Pass qdrant instance to avoid re-fetching
                        await self._process_batch(chunk, qdrant)
                        job.records_processed += len(chunk)
                    except Exception as e:
                        job.records_failed += len(chunk)
                        logger.error(f"Batch processing error in job {job_id}: {e}")
                    
                    chunk = [] # Reset
                    await asyncio.sleep(0.01) # Yield
            
            job.status = IngestionStatus.COMPLETED
            logger.info(f"Ingestion job {job_id} completed successfully")
            
        except Exception as e:
            job.status = IngestionStatus.FAILED
            job.error = str(e)
            logger.error(f"Ingestion job {job_id} failed: {e}")
        
        finally:
            job.completed_at = datetime.now(timezone.utc)
    
    async def _process_batch(self, records: List[Dict[str, Any]], qdrant_service=None):
        """Process a batch of records: Embed -> Index"""
        embedding_service = get_embedding_service()
        qdrant = qdrant_service or get_qdrant_service()
        
        # 1. Prepare texts for embedding
        texts = []
        for r in records:
            # Simple concatenation strategy
            # Filter out empty values and join
            values = [str(v) for k, v in r.items() if v and len(str(v)) < 1000] 
            texts.append(" ".join(values[:5])) # Limit to first 5 fields to avoid huge context
            
        # 2. Generate Embeddings (Batch)
        # Verify if generate_batch_embeddings is async-compatible?
        # The service has `generate_batch_embeddings` which is synchronous/blocking.
        # We should wrap it.
        
        loop = asyncio.get_event_loop()
        embeddings = await loop.run_in_executor(
            None, 
            embedding_service.generate_batch_embeddings, 
            texts
        )
        
        # 3. Prepare Qdrant payload
        documents = []
        for i, record in enumerate(records):
            documents.append({
                "id": record.get("id") or str(uuid.uuid4()),
                "embedding": embeddings[i],
                "metadata": record
            })
            
        # 4. Index
        await qdrant.index_batch(documents)


# Singleton instance
ingestor_service = IngestorService()
