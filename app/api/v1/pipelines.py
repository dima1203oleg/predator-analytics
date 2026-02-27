from __future__ import annotations


"""Predator Analytics v45 - Pipeline API Endpoints
Orchestrates ETL, Indexing, ML Training, and Optimization pipelines.
"""
from typing import TYPE_CHECKING, Any, Dict, List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from fastapi.responses import JSONResponse

from app.core.auth import get_current_user
from app.models.entities import JobCreate, JobResponse, JobStatus, JobType, JobUpdate
from app.services.data_hub_service import data_hub_service
from app.services.pipeline_service import pipeline_service


if TYPE_CHECKING:
    from uuid import UUID

    from app.models.user import User


router = APIRouter(prefix="/pipelines", tags=["Pipelines"])

# ========================================================================
# PIPELINE EXECUTION ENDPOINTS
# ========================================================================

@router.post("/execute/{pipeline_type}")
async def execute_pipeline(
    pipeline_type: JobType,
    dataset_id: UUID | None = None,
    config: dict[str, Any] | None = None,
    background_tasks: BackgroundTasks = BackgroundTasks(),
    current_user: User = Depends(get_current_user)
):
    """Execute a pipeline asynchronously
    Pipeline types: ingestion, etl, indexing, training, synthetic, optimization.
    """
    try:
        # Create job record
        job_data = JobCreate(
            dataset_id=dataset_id,
            job_type=pipeline_type,
            name=f"{pipeline_type.value} pipeline",
            description=f"Execute {pipeline_type.value} pipeline",
            config=config
        )

        job = await data_hub_service.create_ingestion_job(dataset_id) if dataset_id else None

        if not job:
            # Create generic job if no dataset
            job = await _create_generic_job(job_data, current_user.id)

        # Execute pipeline in background
        background_tasks.add_task(
            pipeline_service.execute_pipeline,
            job.id,
            pipeline_type,
            dataset_id,
            config
        )

        return {
            "success": True,
            "job_id": job.id,
            "pipeline_type": pipeline_type.value,
            "status": "started",
            "message": f"{pipeline_type.value} pipeline started"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline execution failed: {e!s}")

@router.post("/datasets/{dataset_id}/ingest")
async def trigger_ingestion_pipeline(
    dataset_id: UUID,
    background_tasks: BackgroundTasks = BackgroundTasks(),
    current_user: User = Depends(get_current_user)
):
    """Trigger ingestion pipeline for specific dataset."""
    try:
        # Create ingestion job
        job = await data_hub_service.create_ingestion_job(dataset_id)

        # Execute pipeline in background
        background_tasks.add_task(
            pipeline_service.execute_pipeline,
            job.id,
            JobType.INGESTION,
            dataset_id,
            {"auto_index": True}
        )

        return {
            "success": True,
            "job_id": job.id,
            "dataset_id": dataset_id,
            "message": "Ingestion pipeline started"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {e!s}")

@router.post("/datasets/{dataset_id}/etl")
async def trigger_etl_pipeline(
    dataset_id: UUID,
    config: dict[str, Any] | None = None,
    background_tasks: BackgroundTasks = BackgroundTasks(),
    current_user: User = Depends(get_current_user)
):
    """Trigger ETL pipeline for dataset."""
    try:
        # Create ETL job
        job_data = JobCreate(
            dataset_id=dataset_id,
            job_type=JobType.ETL,
            name=f"ETL for dataset {dataset_id}",
            description="Clean and transform dataset",
            config=config
        )
        job = await _create_job(job_data)

        # Execute pipeline in background
        background_tasks.add_task(
            pipeline_service.execute_pipeline,
            job.id,
            JobType.ETL,
            dataset_id,
            config
        )

        return {
            "success": True,
            "job_id": job.id,
            "dataset_id": dataset_id,
            "message": "ETL pipeline started"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ETL failed: {e!s}")

@router.post("/datasets/{dataset_id}/index")
async def trigger_indexing_pipeline(
    dataset_id: UUID,
    config: dict[str, Any] | None = None,
    background_tasks: BackgroundTasks = BackgroundTasks(),
    current_user: User = Depends(get_current_user)
):
    """Trigger indexing pipeline for dataset."""
    try:
        # Create indexing job
        job_data = JobCreate(
            dataset_id=dataset_id,
            job_type=JobType.INDEXING,
            name=f"Indexing for dataset {dataset_id}",
            description="Index dataset in OpenSearch and Qdrant",
            config=config
        )
        job = await _create_job(job_data)

        # Execute pipeline in background
        background_tasks.add_task(
            pipeline_service.execute_pipeline,
            job.id,
            JobType.INDEXING,
            dataset_id,
            config
        )

        return {
            "success": True,
            "job_id": job.id,
            "dataset_id": dataset_id,
            "message": "Indexing pipeline started"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Indexing failed: {e!s}")

@router.post("/datasets/{dataset_id}/train")
async def trigger_training_pipeline(
    dataset_id: UUID,
    config: dict[str, Any] | None = None,
    background_tasks: BackgroundTasks = BackgroundTasks(),
    current_user: User = Depends(get_current_user)
):
    """Trigger ML training pipeline for dataset."""
    try:
        # Create training job
        job_data = JobCreate(
            dataset_id=dataset_id,
            job_type=JobType.TRAINING,
            name=f"ML Training for dataset {dataset_id}",
            description="Train ML model on dataset",
            config=config
        )
        job = await _create_job(job_data)

        # Execute pipeline in background
        background_tasks.add_task(
            pipeline_service.execute_pipeline,
            job.id,
            JobType.TRAINING,
            dataset_id,
            config
        )

        return {
            "success": True,
            "job_id": job.id,
            "dataset_id": dataset_id,
            "message": "Training pipeline started"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training failed: {e!s}")

@router.post("/datasets/{dataset_id}/synthetic")
async def trigger_synthetic_pipeline(
    dataset_id: UUID,
    config: dict[str, Any] | None = None,
    background_tasks: BackgroundTasks = BackgroundTasks(),
    current_user: User = Depends(get_current_user)
):
    """Trigger synthetic data generation pipeline."""
    try:
        # Create synthetic job
        job_data = JobCreate(
            dataset_id=dataset_id,
            job_type=JobType.SYNTHETIC,
            name=f"Synthetic data for dataset {dataset_id}",
            description="Generate synthetic data from dataset",
            config=config
        )
        job = await _create_job(job_data)

        # Execute pipeline in background
        background_tasks.add_task(
            pipeline_service.execute_pipeline,
            job.id,
            JobType.SYNTHETIC,
            dataset_id,
            config
        )

        return {
            "success": True,
            "job_id": job.id,
            "dataset_id": dataset_id,
            "message": "Synthetic data pipeline started"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Synthetic generation failed: {e!s}")

@router.post("/optimize")
async def trigger_optimization_pipeline(
    config: dict[str, Any] | None = None,
    background_tasks: BackgroundTasks = BackgroundTasks(),
    current_user: User = Depends(get_current_user)
):
    """Trigger self-improvement optimization pipeline."""
    try:
        # Create optimization job
        job_data = JobCreate(
            job_type=JobType.OPTIMIZATION,
            name="System Optimization",
            description="Run self-improvement optimization",
            config=config
        )
        job = await _create_job(job_data)

        # Execute pipeline in background
        background_tasks.add_task(
            pipeline_service.execute_pipeline,
            job.id,
            JobType.OPTIMIZATION,
            None,
            config
        )

        return {
            "success": True,
            "job_id": job.id,
            "message": "Optimization pipeline started"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Optimization failed: {e!s}")

# ========================================================================
# PIPELINE STATUS ENDPOINTS
# ========================================================================

@router.get("/jobs", response_model=list[JobResponse])
async def list_pipeline_jobs(
    pipeline_type: JobType | None = None,
    status: JobStatus | None = None,
    dataset_id: UUID | None = None,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user)
):
    """List pipeline jobs with filters."""
    try:
        return await data_hub_service.list_jobs(
            dataset_id=dataset_id,
            job_type=pipeline_type,
            status=status,
            limit=limit,
            offset=offset
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/jobs/{job_id}", response_model=JobResponse)
async def get_pipeline_job(
    job_id: UUID,
    current_user: User = Depends(get_current_user)
):
    """Get pipeline job by ID."""
    job = await data_hub_service.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.get("/jobs/{job_id}/logs")
async def get_job_logs(
    job_id: UUID,
    current_user: User = Depends(get_current_user)
):
    """Get detailed logs for pipeline job."""
    job = await data_hub_service.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return {
        "job_id": job_id,
        "logs": job.logs or {},
        "error_message": job.error_message,
        "result": job.result,
        "status": job.status,
        "progress": job.progress
    }

@router.post("/jobs/{job_id}/cancel")
async def cancel_pipeline_job(
    job_id: UUID,
    current_user: User = Depends(get_current_user)
):
    """Cancel running pipeline job."""
    try:
        # Update job status to cancelled
        from app.models.entities import JobUpdate
        update_data = JobUpdate(status=JobStatus.CANCELLED)
        job = await data_hub_service.update_job(job_id, update_data)

        if not job:
            raise HTTPException(status_code=404, detail="Job not found")

        return {
            "success": True,
            "job_id": job_id,
            "message": "Job cancelled successfully"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cancel failed: {e!s}")

@router.post("/jobs/{job_id}/retry")
async def retry_pipeline_job(
    job_id: UUID,
    current_user: User = Depends(get_current_user)
):
    """Retry failed pipeline job."""
    try:
        job = await data_hub_service.get_job(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")

        if job.status != JobStatus.FAILED:
            raise HTTPException(status_code=400, detail="Job is not in failed state")

        # Reset job status and retry
        from app.models.entities import JobUpdate
        update_data = JobUpdate(
            status=JobStatus.QUEUED,
            progress=0.0,
            error_message=None
        )
        job = await data_hub_service.update_job(job_id, update_data)

        # Restart pipeline in background
        from fastapi import BackgroundTasks
        background_tasks = BackgroundTasks()
        background_tasks.add_task(
            pipeline_service.execute_pipeline,
            job_id,
            JobType(job.job_type),
            job.dataset_id,
            job.config
        )

        return {
            "success": True,
            "job_id": job_id,
            "message": "Job retry started"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Retry failed: {e!s}")

# ========================================================================
# PIPELINE STATISTICS ENDPOINTS
# ========================================================================

@router.get("/stats")
async def get_pipeline_stats(
    current_user: User = Depends(get_current_user)
):
    """Get pipeline execution statistics."""
    try:
        # Get all jobs
        all_jobs = await data_hub_service.list_jobs(limit=1000)

        # Calculate statistics
        stats = {
            "total_jobs": len(all_jobs),
            "jobs_by_status": {},
            "jobs_by_type": {},
            "success_rate": 0.0,
            "average_duration": 0.0,
            "recent_jobs": []
        }

        # Count by status
        for status in JobStatus:
            count = len([j for j in all_jobs if j.status == status.value])
            stats["jobs_by_status"][status.value] = count

        # Count by type
        for job_type in JobType:
            count = len([j for j in all_jobs if j.job_type == job_type.value])
            stats["jobs_by_type"][job_type.value] = count

        # Calculate success rate
        completed = len([j for j in all_jobs if j.status == JobStatus.COMPLETED.value])
        failed = len([j for j in all_jobs if j.status == JobStatus.FAILED.value])
        total_finished = completed + failed

        if total_finished > 0:
            stats["success_rate"] = (completed / total_finished) * 100

        # Recent jobs (last 10)
        stats["recent_jobs"] = all_jobs[:10]

        return stats

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/definitions")
async def get_pipeline_definitions(
    current_user: User = Depends(get_current_user)
):
    """Get available pipeline definitions and their steps."""
    try:
        definitions = {}

        for job_type, pipeline in pipeline_service.pipelines.items():
            definitions[job_type.value] = {
                "name": job_type.value,
                "description": f"{job_type.value} pipeline",
                "steps": [
                    {
                        "name": step.name,
                        "depends_on": step.depends_on or [],
                        "retry_count": step.retry_count,
                        "timeout_seconds": step.timeout_seconds,
                        "critical": step.critical
                    }
                    for step in pipeline
                ]
            }

        return definitions

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ========================================================================
# HELPER FUNCTIONS
# ========================================================================

async def _create_job(job_data: JobCreate) -> JobResponse:
    """Create a job record."""
    # This would typically use the data_hub_service
    # For now, we'll create a minimal implementation
    from app.core.db import async_session_maker
    from app.models.entities import Job, JobStatus

    async with async_session_maker() as session:
        job = Job(
            dataset_id=job_data.dataset_id,
            job_type=job_data.job_type.value,
            status=JobStatus.QUEUED.value,
            name=job_data.name,
            description=job_data.description,
            config=job_data.config,
            parameters=job_data.parameters
        )
        session.add(job)
        await session.commit()
        await session.refresh(job)

        return JobResponse.from_orm(job)

async def _create_generic_job(job_data: JobCreate, user_id: UUID) -> JobResponse:
    """Create a generic job without dataset."""
    return await _create_job(job_data)
