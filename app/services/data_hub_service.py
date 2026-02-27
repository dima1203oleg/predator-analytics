from __future__ import annotations


"""Predator Analytics v45 - Data Hub Service
Manages Sources, Datasets, and Jobs lifecycle.
"""
from datetime import datetime
import logging
from typing import TYPE_CHECKING, Any, Dict, List, Optional, Tuple

from fastapi import HTTPException, UploadFile
from sqlalchemy import and_, delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import async_session_maker
from app.models.entities import (
    DataHubStats,
    Dataset,
    DatasetCreate,
    DatasetResponse,
    DatasetStatus,
    DatasetUpdate,
    Job,
    JobResponse,
    JobStatus,
    JobType,
    Source,
    SourceCreate,
    SourceResponse,
    SourceType,
    SourceUpdate,
    UploadWizardResult,
)
from app.services.etl_ingestion import ETLIngestionService
from app.services.minio_service import MinIOService


if TYPE_CHECKING:
    from uuid import UUID


logger = logging.getLogger(__name__)

class DataHubService:
    """Core service for Data Hub functionality."""

    def __init__(self):
        self.minio_service = MinIOService()
        self.etl_service = ETLIngestionService()

    # ========================================================================
    # SOURCES MANAGEMENT
    # ========================================================================

    async def create_source(self, source_data: SourceCreate) -> SourceResponse:
        """Create new data source."""
        async with async_session_maker() as session:
            source = Source(
                name=source_data.name,
                description=source_data.description,
                source_type=source_data.source_type.value,
                config=source_data.config,
                meta=source_data.meta
            )
            session.add(source)
            await session.commit()
            await session.refresh(source)

            logger.info(f"Created source: {source.name} ({source.source_type})")
            return SourceResponse.from_orm(source)

    async def get_source(self, source_id: UUID) -> SourceResponse | None:
        """Get source by ID."""
        async with async_session_maker() as session:
            result = await session.execute(
                select(Source).where(Source.id == source_id)
            )
            source = result.scalar_one_or_none()
            return SourceResponse.from_orm(source) if source else None

    async def list_sources(
        self,
        source_type: SourceType | None = None,
        is_active: bool | None = None,
        limit: int = 50,
        offset: int = 0
    ) -> list[SourceResponse]:
        """List sources with filters."""
        async with async_session_maker() as session:
            query = select(Source)

            if source_type:
                query = query.where(Source.source_type == source_type.value)
            if is_active is not None:
                query = query.where(Source.is_active == is_active)

            query = query.order_by(Source.created_at.desc()).offset(offset).limit(limit)

            result = await session.execute(query)
            sources = result.scalars().all()
            return [SourceResponse.from_orm(s) for s in sources]

    async def update_source(self, source_id: UUID, update_data: SourceUpdate) -> SourceResponse | None:
        """Update source."""
        async with async_session_maker() as session:
            # Build update dict
            update_dict = update_data.dict(exclude_unset=True)
            if update_dict:
                # Convert enum values
                if 'source_type' in update_dict:
                    update_dict['source_type'] = update_dict['source_type'].value

                stmt = update(Source).where(Source.id == source_id).values(**update_dict)
                await session.execute(stmt)
                await session.commit()

            return await self.get_source(source_id)

    async def delete_source(self, source_id: UUID) -> bool:
        """Delete source (soft delete by setting is_active=False)."""
        async with async_session_maker() as session:
            stmt = update(Source).where(Source.id == source_id).values(
                is_active=False,
                updated_at=datetime.utcnow()
            )
            result = await session.execute(stmt)
            await session.commit()

            if result.rowcount > 0:
                logger.info(f"Soft deleted source: {source_id}")
                return True
            return False

    # ========================================================================
    # DATASETS MANAGEMENT
    # ========================================================================

    async def create_dataset(self, dataset_data: DatasetCreate) -> DatasetResponse:
        """Create new dataset."""
        async with async_session_maker() as session:
            dataset = Dataset(
                source_id=dataset_data.source_id,
                name=dataset_data.name,
                description=dataset_data.description,
                file_path=dataset_data.file_path,
                file_type=dataset_data.file_type,
                status=DatasetStatus.UPLOADED
            )
            session.add(dataset)
            await session.commit()
            await session.refresh(dataset)

            logger.info(f"Created dataset: {dataset.name} from source {dataset.source_id}")
            return DatasetResponse.from_orm(dataset)

    async def get_dataset(self, dataset_id: UUID, include_source: bool = True) -> DatasetResponse | None:
        """Get dataset by ID."""
        async with async_session_maker() as session:
            query = select(Dataset).where(Dataset.id == dataset_id)

            if include_source:
                query = query.join(Source)

            result = await session.execute(query)
            dataset = result.scalar_one_or_none()

            if not dataset:
                return None

            response = DatasetResponse.from_orm(dataset)
            if include_source and dataset.source:
                response.source = SourceResponse.from_orm(dataset.source)

            return response

    async def list_datasets(
        self,
        source_id: UUID | None = None,
        status: DatasetStatus | None = None,
        limit: int = 50,
        offset: int = 0
    ) -> list[DatasetResponse]:
        """List datasets with filters."""
        async with async_session_maker() as session:
            query = select(Dataset).join(Source)

            if source_id:
                query = query.where(Dataset.source_id == source_id)
            if status:
                query = query.where(Dataset.status == status.value)

            query = query.order_by(Dataset.created_at.desc()).offset(offset).limit(limit)

            result = await session.execute(query)
            datasets = result.scalars().all()

            responses = []
            for dataset in datasets:
                response = DatasetResponse.from_orm(dataset)
                response.source = SourceResponse.from_orm(dataset.source)
                responses.append(response)

            return responses

    async def update_dataset(self, dataset_id: UUID, update_data: DatasetUpdate) -> DatasetResponse | None:
        """Update dataset."""
        async with async_session_maker() as session:
            update_dict = update_data.dict(exclude_unset=True)
            if update_dict:
                # Convert enum values
                if 'status' in update_dict:
                    update_dict['status'] = update_dict['status'].value

                stmt = update(Dataset).where(Dataset.id == dataset_id).values(**update_dict)
                await session.execute(stmt)
                await session.commit()

            return await self.get_dataset(dataset_id)

    async def delete_dataset(self, dataset_id: UUID) -> bool:
        """Delete dataset."""
        async with async_session_maker() as session:
            stmt = delete(Dataset).where(Dataset.id == dataset_id)
            result = await session.execute(stmt)
            await session.commit()

            if result.rowcount > 0:
                logger.info(f"Deleted dataset: {dataset_id}")
                return True
            return False

    # ========================================================================
    # UPLOAD WIZARD
    # ========================================================================

    async def upload_file_wizard(
        self,
        file: UploadFile,
        source_name: str | None = None,
        description: str | None = None
    ) -> UploadWizardResult:
        """Complete upload wizard flow:
        1. Create Source
        2. Upload file to MinIO
        3. Create Dataset
        4. Start Ingestion Job
        5. Return preview.
        """
        try:
            # 1. Create Source
            source_type = SourceType.FILE
            if not source_name:
                source_name = f"Upload: {file.filename}"

            source_data = SourceCreate(
                name=source_name,
                description=description,
                source_type=source_type,
                config={
                    "filename": file.filename,
                    "content_type": file.content_type,
                    "upload_method": "wizard"
                }
            )
            source = await self.create_source(source_data)

            # 2. Upload to MinIO

            object_name = f"uploads/{source.id}/{file.filename}"

            # Save to temp file using chunks to avoid OOM
            import os
            import tempfile

            # Create temp file explicitly
            fd, temp_file_path = tempfile.mkstemp()
            preview = {}
            try:
                with os.fdopen(fd, 'wb') as tmp:
                    # Retrieve file in 1MB chunks
                    while content := await file.read(1024 * 1024):
                        tmp.write(content)

                await file.seek(0) # Reset if needed for preview, but we use temp path

                # Generate preview (while file exists)
                preview = await self._generate_preview(temp_file_path, file.filename)

                await self.minio_service.upload_file(
                    bucket="raw-data",
                    object_name=object_name,
                    file_path=temp_file_path,
                    content_type=file.content_type
                )
            finally:
                if os.path.exists(temp_file_path):
                    os.unlink(temp_file_path)

            # 3. Create Dataset
            dataset_data = DatasetCreate(
                source_id=source.id,
                name=f"Dataset: {file.filename}",
                description=f"Uploaded from {file.filename}",
                file_path=object_name,
                file_type=file.filename.split('.')[-1].lower()
            )
            dataset = await self.create_dataset(dataset_data)

            # 4. Start Ingestion Job
            job = await self.create_ingestion_job(dataset.id)

            # 5. Preview generated above (while file existed)

            return UploadWizardResult(
                source=source,
                dataset=dataset,
                job=job,
                preview=preview
            )

        except Exception as e:
            logger.exception(f"Upload wizard failed: {e}")
            raise HTTPException(status_code=500, detail=f"Upload failed: {e!s}")

    async def _generate_preview(self, file_path: str, filename: str) -> dict[str, Any]:
        """Generate preview of uploaded file."""
        try:
            import pandas as pd

            file_ext = filename.rsplit('.', maxsplit=1)[-1].lower()

            if file_ext in ['csv', 'tsv']:
                df = pd.read_csv(file_path, nrows=10)
            elif file_ext in ['xlsx', 'xls']:
                df = pd.read_excel(file_path, nrows=10)
            else:
                return {"error": f"Preview not supported for {file_ext} files"}

            return {
                "columns": list(df.columns),
                "dtypes": df.dtypes.to_dict(),
                "sample_rows": df.head(5).to_dict('records'),
                "shape_preview": f"Showing 5 of {len(df)} columns"
            }

        except Exception as e:
            logger.warning(f"Preview generation failed: {e}")
            return {"error": f"Preview failed: {e!s}"}

    # ========================================================================
    # JOBS MANAGEMENT
    # ========================================================================

    async def create_ingestion_job(self, dataset_id: UUID) -> JobResponse:
        """Create and start ingestion job for dataset."""
        async with async_session_maker() as session:
            job = Job(
                dataset_id=dataset_id,
                job_type=JobType.INGESTION.value,
                name=f"Ingestion for dataset {dataset_id}",
                description="Parse and process uploaded file",
                status=JobStatus.QUEUED.value,
                config={
                    "pipeline": "ingestion",
                    "auto_index": True
                }
            )
            session.add(job)
            await session.commit()
            await session.refresh(job)

            # Start background processing
            await self._start_ingestion_job(job.id)

            logger.info(f"Created ingestion job: {job.id} for dataset {dataset_id}")
            return JobResponse.from_orm(job)

    async def _start_ingestion_job(self, job_id: UUID):
        """Start ingestion job in background."""
        # This would typically use Celery or background tasks
        # For now, we'll mark it as running
        async with async_session_maker() as session:
            stmt = update(Job).where(Job.id == job_id).values(
                status=JobStatus.RUNNING.value,
                started_at=datetime.utcnow(),
                progress=0.0
            )
            await session.execute(stmt)
            await session.commit()

        # Trigger ETL pipeline (Parser -> Processor -> Indexer)
        logger.info(f"Started ingestion job: {job_id} (ETL Triggered)")

    async def get_job(self, job_id: UUID) -> JobResponse | None:
        """Get job by ID."""
        async with async_session_maker() as session:
            result = await session.execute(
                select(Job).where(Job.id == job_id)
            )
            job = result.scalar_one_or_none()

            if not job:
                return None

            response = JobResponse.from_orm(job)
            if job.dataset:
                response.dataset = DatasetResponse.from_orm(job.dataset)

            return response

    async def list_jobs(
        self,
        dataset_id: UUID | None = None,
        job_type: JobType | None = None,
        status: JobStatus | None = None,
        limit: int = 50,
        offset: int = 0
    ) -> list[JobResponse]:
        """List jobs with filters."""
        async with async_session_maker() as session:
            query = select(Job).join(Dataset)

            if dataset_id:
                query = query.where(Job.dataset_id == dataset_id)
            if job_type:
                query = query.where(Job.job_type == job_type.value)
            if status:
                query = query.where(Job.status == status.value)

            query = query.order_by(Job.created_at.desc()).offset(offset).limit(limit)

            result = await session.execute(query)
            jobs = result.scalars().all()

            responses = []
            for job in jobs:
                response = JobResponse.from_orm(job)
                if job.dataset:
                    response.dataset = DatasetResponse.from_orm(job.dataset)
                responses.append(response)

            return responses

    # ========================================================================
    # STATISTICS AND DASHBOARD
    # ========================================================================

    async def get_data_hub_stats(self) -> DataHubStats:
        """Get statistics for Data Hub dashboard."""
        async with async_session_maker() as session:
            # Sources stats
            total_sources = await session.scalar(
                select(func.count(Source.id))
            )
            active_sources = await session.scalar(
                select(func.count(Source.id)).where(Source.is_active)
            )

            # Datasets stats
            total_datasets = await session.scalar(
                select(func.count(Dataset.id))
            )

            datasets_by_status = {}
            for status in DatasetStatus:
                count = await session.scalar(
                    select(func.count(Dataset.id)).where(Dataset.status == status.value)
                )
                datasets_by_status[status.value] = count

            # Jobs stats
            total_jobs = await session.scalar(
                select(func.count(Job.id))
            )

            jobs_by_status = {}
            for status in JobStatus:
                count = await session.scalar(
                    select(func.count(Job.id)).where(Job.status == status.value)
                )
                jobs_by_status[status.value] = count

            # Storage stats (simplified)
            storage_used = 0  # Placeholder until MinIO metrics integration

            # Recent uploads
            recent_datasets_result = await session.execute(
                select(Dataset)
                .join(Source)
                .order_by(Dataset.created_at.desc())
                .limit(5)
            )
            recent_datasets = recent_datasets_result.scalars().all()
            recent_uploads = []
            for dataset in recent_datasets:
                response = DatasetResponse.from_orm(dataset)
                response.source = SourceResponse.from_orm(dataset.source)
                recent_uploads.append(response)

            return DataHubStats(
                total_sources=total_sources or 0,
                active_sources=active_sources or 0,
                total_datasets=total_datasets or 0,
                datasets_by_status=datasets_by_status,
                total_jobs=total_jobs or 0,
                jobs_by_status=jobs_by_status,
                storage_used=storage_used,
                recent_uploads=recent_uploads
            )

# Singleton instance
data_hub_service = DataHubService()
