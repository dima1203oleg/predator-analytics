from __future__ import annotations


"""Predator Analytics v45 - Data Hub API Endpoints
RESTful API for Sources, Datasets, and Jobs management.
"""
from typing import TYPE_CHECKING, Any

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app.api.deps import get_current_user
from app.models.entities import (
    DataHubStats,
    DatasetCreate,
    DatasetResponse,
    DatasetStatus,
    DatasetUpdate,
    JobResponse,
    JobStatus,
    JobType,
    SourceCreate,
    SourceResponse,
    SourceType,
    SourceUpdate,
    UploadWizardResult,
)
from app.services.data_hub_service import data_hub_service


if TYPE_CHECKING:
    from uuid import UUID


User = Any

router = APIRouter(prefix="/data-hub", tags=["Data Hub"])

# ========================================================================
# SOURCES ENDPOINTS
# ========================================================================


@router.post("/sources", response_model=SourceResponse)
async def create_source(source_data: SourceCreate, current_user: User = Depends(get_current_user)):
    """Create new data source."""
    try:
        return await data_hub_service.create_source(source_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sources", response_model=list[SourceResponse])
async def list_sources(
    source_type: SourceType | None = None,
    is_active: bool | None = None,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
):
    """List data sources with filters."""
    try:
        return await data_hub_service.list_sources(
            source_type=source_type, is_active=is_active, limit=limit, offset=offset
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sources/{source_id}", response_model=SourceResponse)
async def get_source(source_id: UUID, current_user: User = Depends(get_current_user)):
    """Get source by ID."""
    source = await data_hub_service.get_source(source_id)
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    return source


@router.put("/sources/{source_id}", response_model=SourceResponse)
async def update_source(source_id: UUID, update_data: SourceUpdate, current_user: User = Depends(get_current_user)):
    """Update source."""
    source = await data_hub_service.update_source(source_id, update_data)
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    return source


@router.delete("/sources/{source_id}")
async def delete_source(source_id: UUID, current_user: User = Depends(get_current_user)):
    """Delete source (soft delete)."""
    success = await data_hub_service.delete_source(source_id)
    if not success:
        raise HTTPException(status_code=404, detail="Source not found")
    return {"success": True, "message": "Source deleted successfully"}


# ========================================================================
# DATASETS ENDPOINTS
# ========================================================================


@router.post("/datasets", response_model=DatasetResponse)
async def create_dataset(dataset_data: DatasetCreate, current_user: User = Depends(get_current_user)):
    """Create new dataset."""
    try:
        return await data_hub_service.create_dataset(dataset_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/datasets", response_model=list[DatasetResponse])
async def list_datasets(
    source_id: UUID | None = None,
    status: DatasetStatus | None = None,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
):
    """List datasets with filters."""
    try:
        return await data_hub_service.list_datasets(source_id=source_id, status=status, limit=limit, offset=offset)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/datasets/{dataset_id}", response_model=DatasetResponse)
async def get_dataset(dataset_id: UUID, current_user: User = Depends(get_current_user)):
    """Get dataset by ID."""
    dataset = await data_hub_service.get_dataset(dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return dataset


@router.put("/datasets/{dataset_id}", response_model=DatasetResponse)
async def update_dataset(dataset_id: UUID, update_data: DatasetUpdate, current_user: User = Depends(get_current_user)):
    """Update dataset."""
    dataset = await data_hub_service.update_dataset(dataset_id, update_data)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return dataset


@router.delete("/datasets/{dataset_id}")
async def delete_dataset(dataset_id: UUID, current_user: User = Depends(get_current_user)):
    """Delete dataset."""
    success = await data_hub_service.delete_dataset(dataset_id)
    if not success:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return {"success": True, "message": "Dataset deleted successfully"}


@router.get("/datasets/{dataset_id}/status")
async def get_dataset_status(dataset_id: UUID, current_user: User = Depends(get_current_user)):
    """Get dataset processing status."""
    dataset = await data_hub_service.get_dataset(dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    # Get latest job for this dataset
    jobs = await data_hub_service.list_jobs(dataset_id=dataset_id, limit=1)

    return {
        "dataset_id": str(dataset_id),
        "status": dataset.status,
        "latest_job": jobs[0] if jobs else None,
        "progress": jobs[0].progress if jobs else 0.0,
        "updated_at": dataset.updated_at,
    }


# ========================================================================
# UPLOAD WIZARD
# ========================================================================


@router.post("/upload", response_model=UploadWizardResult)
async def upload_file_wizard(
    file: UploadFile = File(...),
    source_name: str | None = Form(None),
    description: str | None = Form(None),
    current_user: User = Depends(get_current_user),
):
    """Upload file wizard:
    - Creates source
    - Uploads to MinIO
    - Creates dataset
    - Starts ingestion job
    - Returns preview.
    """
    try:
        return await data_hub_service.upload_file_wizard(file=file, source_name=source_name, description=description)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {e!s}")


@router.post("/preview")
async def preview_file(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    """Generate preview of uploaded file without saving."""
    try:
        # Save to temp file
        import os
        import tempfile

        content = await file.read()
        with tempfile.NamedTemporaryFile(delete=False, suffix=f"_{file.filename}") as temp_file:
            temp_file.write(content)
            temp_file_path = temp_file.name

        try:
            preview = await data_hub_service._generate_preview(temp_file_path, file.filename)
            return {
                "filename": file.filename,
                "content_type": file.content_type,
                "size": len(content),
                "preview": preview,
            }
        finally:
            os.unlink(temp_file_path)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Preview failed: {e!s}")


# ========================================================================
# JOBS ENDPOINTS
# ========================================================================


@router.get("/jobs", response_model=list[JobResponse])
async def list_jobs(
    dataset_id: UUID | None = None,
    job_type: JobType | None = None,
    status: JobStatus | None = None,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
):
    """List jobs with filters."""
    try:
        return await data_hub_service.list_jobs(
            dataset_id=dataset_id, job_type=job_type, status=status, limit=limit, offset=offset
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/jobs/{job_id}", response_model=JobResponse)
async def get_job(job_id: UUID, current_user: User = Depends(get_current_user)):
    """Get job by ID."""
    job = await data_hub_service.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.post("/datasets/{dataset_id}/ingest")
async def trigger_ingestion(dataset_id: UUID, current_user: User = Depends(get_current_user)):
    """Manually trigger ingestion for dataset."""
    try:
        return await data_hub_service.create_ingestion_job(dataset_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ========================================================================
# STATISTICS ENDPOINTS
# ========================================================================


@router.get("/stats", response_model=DataHubStats)
async def get_data_hub_stats(current_user: User = Depends(get_current_user)):
    """Get Data Hub statistics for dashboard."""
    try:
        return await data_hub_service.get_data_hub_stats()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ========================================================================
# BULK OPERATIONS
# ========================================================================


@router.post("/datasets/{dataset_id}/retry")
async def retry_dataset_processing(dataset_id: UUID, current_user: User = Depends(get_current_user)):
    """Retry failed dataset processing."""
    dataset = await data_hub_service.get_dataset(dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    if dataset.status != DatasetStatus.FAILED:
        raise HTTPException(status_code=400, detail="Dataset is not in failed state")

    # Reset status and create new job
    await data_hub_service.update_dataset(dataset_id, DatasetUpdate(status=DatasetStatus.UPLOADED))

    job = await data_hub_service.create_ingestion_job(dataset_id)
    return {"success": True, "message": "Processing restarted", "job": job}


@router.delete("/datasets/{dataset_id}/data")
async def delete_dataset_data(dataset_id: UUID, current_user: User = Depends(get_current_user)):
    """Delete dataset data but keep metadata."""
    # TODO: Implement data cleanup from MinIO, OpenSearch, Qdrant
    return {"success": True, "message": "Dataset data deletion scheduled"}
