from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl
import logging

from app.services.adip.adip_core import adip_core
from app.services.adip.task_tracker import task_tracker
from typing import Optional

logger = logging.getLogger(__name__)

adip_router = APIRouter()

class DiscoverRequest(BaseModel):
    url: HttpUrl

@adip_router.post("/discover")
async def discover_source(request: DiscoverRequest):
    """
    Triggers the Autonomous Connector Factory (ADIP) pipeline to scan a URL,
    discover its API structure, and generate a new Python connector.
    """
    logger.info(f"Received ADIP discover request for: {request.url}")
    try:
        # Convert HttpUrl to string
        result = await adip_core.process_new_source(str(request.url))
        return result
    except Exception as e:
        logger.error(f"ADIP discovery failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class TaskCreateRequest(BaseModel):
    name: str
    agent: str
    priority: str = "MEDIUM"

class TaskUpdateRequest(BaseModel):
    progress: int
    log: Optional[str] = None
    status: str = "RUNNING"

@adip_router.post("/tasks")
async def create_task(request: TaskCreateRequest):
    task_id = task_tracker.start_task(name=request.name, agent=request.agent, priority=request.priority)
    return {"task_id": task_id}

@adip_router.patch("/tasks/{task_id}")
async def update_task(task_id: str, request: TaskUpdateRequest):
    task_tracker.update_task(task_id, progress=request.progress, log=request.log, status=request.status)
    return {"status": "ok"}

@adip_router.get("/tasks")
async def get_tasks():
    return task_tracker.get_all_tasks()

@adip_router.get("/ecosystem")
async def get_ecosystem():
    """Повертає підсумковий стан екосистеми з Knowledge Base та Meta-Learning."""
    return adip_core.get_ecosystem_status()

@adip_router.get("/sources")
async def get_sources():
    """Повертає перелік усіх відстежуваних джерел даних."""
    return adip_core.kb.get_all_sources()

class TriggerHealingRequest(BaseModel):
    url: str
    error_type: str = "MANUAL_TRIGGER"
    details: str = "Штучний запуск Self-Healing з UI Дашборду"

@adip_router.post("/heal")
async def trigger_self_healing(request: TriggerHealingRequest):
    """Штучний або автоматичний запуск Self-Healing для джерела."""
    logger.info(f"UI Trigger Self-Healing for: {request.url}")
    res = await adip_core.handle_runtime_incident(
        source_url=request.url,
        error_type=request.error_type,
        details=request.details,
    )
    return res

