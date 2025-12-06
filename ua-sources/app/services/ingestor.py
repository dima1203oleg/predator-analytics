"""
Ingestor Service - Data ingestion pipeline
Handles bulk data import from various sources
"""
from typing import Dict, Any, List, Optional, AsyncGenerator
from dataclasses import dataclass
from datetime import datetime, timezone
from enum import Enum
import asyncio
import logging

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
    Manages bulk data import from external sources
    """
    
    def __init__(self):
        self.active_jobs: Dict[str, IngestionJob] = {}
        self.batch_size = 100
    
    async def start_ingestion(
        self,
        source: str,
        config: Dict[str, Any]
    ) -> IngestionJob:
        """
        Start a new ingestion job
        
        Args:
            source: Data source identifier
            config: Source-specific configuration
        """
        import uuid
        
        job_id = str(uuid.uuid4())[:8]
        job = IngestionJob(
            id=job_id,
            source=source,
            status=IngestionStatus.PENDING,
            records_total=0,
            records_processed=0,
            records_failed=0,
            started_at=None,
            completed_at=None,
            error=None
        )
        
        self.active_jobs[job_id] = job
        
        # Start processing in background
        asyncio.create_task(self._process_job(job_id, config))
        
        return job
    
    async def _process_job(self, job_id: str, config: Dict[str, Any]):
        """Process ingestion job"""
        job = self.active_jobs.get(job_id)
        if not job:
            return
        
        job.status = IngestionStatus.RUNNING
        job.started_at = datetime.now(timezone.utc)
        
        try:
            # Simulate processing
            records = config.get("records", [])
            job.records_total = len(records)
            
            for i, record in enumerate(records):
                # Process each record
                try:
                    await self._process_record(record)
                    job.records_processed += 1
                except Exception as e:
                    job.records_failed += 1
                    logger.error(f"Record processing error: {e}")
                
                # Yield control periodically
                if i % self.batch_size == 0:
                    await asyncio.sleep(0)
            
            job.status = IngestionStatus.COMPLETED
            
        except Exception as e:
            job.status = IngestionStatus.FAILED
            job.error = str(e)
            logger.error(f"Ingestion job {job_id} failed: {e}")
        
        finally:
            job.completed_at = datetime.now(timezone.utc)
    
    async def _process_record(self, record: Dict[str, Any]):
        """Process a single record"""
        # Would save to database in production
        await asyncio.sleep(0.01)  # Simulate IO
    
    def get_job_status(self, job_id: str) -> Optional[IngestionJob]:
        """Get job status"""
        return self.active_jobs.get(job_id)
    
    async def cancel_job(self, job_id: str) -> bool:
        """Cancel a running job"""
        job = self.active_jobs.get(job_id)
        if job and job.status == IngestionStatus.RUNNING:
            job.status = IngestionStatus.CANCELLED
            return True
        return False
    
    def list_jobs(self, limit: int = 10) -> List[IngestionJob]:
        """List recent jobs"""
        jobs = list(self.active_jobs.values())
        return sorted(jobs, key=lambda j: j.started_at or datetime.min, reverse=True)[:limit]


# Singleton instance
ingestor_service = IngestorService()
