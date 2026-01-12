"""Integration Router"""
from fastapi import APIRouter

router = APIRouter(prefix="/integration", tags=["Integration"])


@router.get("/")
async def list_integrations():
    """List integrations"""
    return []


@router.post("/{integration_id}/sync")
async def sync_integration(integration_id: str):
    """Sync integration"""
    return {"id": integration_id, "status": "syncing"}
