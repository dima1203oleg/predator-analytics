"""MinIO Object Storage Infrastructure API (Phase 2E — SM Edition).

Endpoints for MinIO buckets and storage status.
"""
from typing import Any

from fastapi import APIRouter

from app.services.infrastructure.storage.minio_manager import MinIOInfraManager

router = APIRouter(prefix="/infra/storage/minio", tags=["Infrastructure & Storage"])

_mgr = MinIOInfraManager()


@router.get("/status")
async def get_minio_status() -> dict[str, Any]:
    """Стан MinIO storage."""
    return _mgr.get_storage_status()


@router.get("/buckets")
async def list_minio_buckets() -> list[dict[str, Any]]:
    """Перелік MinIO buckets."""
    return _mgr.list_buckets()


@router.get("/buckets/{bucket_name}")
async def get_bucket_stats(bucket_name: str) -> dict[str, Any]:
    """Статистика bucket."""
    return _mgr.get_bucket_stats(bucket_name)
