
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
from app.services.integrations.slack_service import get_slack_service

router = APIRouter(prefix="/integrations", tags=["External Integrations"])

class SyncRequest(BaseModel):
    source: str  # 'slack', 'notion'
    target_id: str # channel_id or page_id

@router.get("/slack/status")
async def slack_status():
    service = get_slack_service()
    return {"configured": service.is_configured()}

@router.get("/slack/channels")
async def list_slack_channels():
    service = get_slack_service()
    if not service.is_configured():
        raise HTTPException(status_code=400, detail="Slack not configured")
    
    try:
        return await service.list_channels()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/slack/sync")
async def sync_slack_channel(request: SyncRequest, background_tasks: BackgroundTasks):
    """
    Trigger background synchronization of a Slack channel.
    """
    if request.source != "slack":
        raise HTTPException(status_code=400, detail="Only slack source supported currently")
    
    service = get_slack_service()
    if not service.is_configured():
        raise HTTPException(status_code=400, detail="Slack not configured")
    
    # Run in background
    background_tasks.add_task(service.index_channel, request.target_id)
    
    return {"status": "started", "message": f"Syncing channel {request.target_id} in background"}
