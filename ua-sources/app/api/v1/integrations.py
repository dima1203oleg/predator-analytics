
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
from app.services.integrations.slack_service import get_slack_service
from app.services.integrations.notion_service import get_notion_service

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

@router.get("/notion/status")
async def notion_status():
    service = get_notion_service()
    return {"configured": service.is_configured()}

@router.get("/notion/search")
async def search_notion(query: str = ""):
    service = get_notion_service()
    if not service.is_configured():
        raise HTTPException(status_code=400, detail="Notion not configured")
    return await service.search(query)

@router.post("/notion/sync")
async def sync_notion_page(request: SyncRequest, background_tasks: BackgroundTasks):
    if request.source != "notion":
        raise HTTPException(status_code=400, detail="Target source must be 'notion'")
    
    service = get_notion_service()
    if not service.is_configured():
        raise HTTPException(status_code=400, detail="Notion not configured")
        
    background_tasks.add_task(service.index_page, request.target_id)
    return {"status": "started", "message": f"Syncing page {request.target_id}"}
