"""
Ingestion Router — PREDATOR Analytics v55.1 Ironclad.

Triggering and monitoring data ingestion pipelines.
"""
from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import PermissionChecker
from app.core.permissions import Permission

router = APIRouter(prefix="/ingestion", tags=["ingestion"])

@router.post("/trigger")
async def trigger_ingestion(
    source: str,
    _ = Depends(PermissionChecker([Permission.WRITE_CORP_DATA]))
):
    """Тригер запуску пайплайну імпорту даних."""
    # TODO: Push to Kafka topic 'ingestion-triggers'
    return {"status": "triggered", "source": source}

@router.get("/status")
async def get_ingestion_status(
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA]))
):
    """Статус активних пайплайнів."""
    return {"active_jobs": 0}
