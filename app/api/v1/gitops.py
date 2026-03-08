from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Dict, Any, List
from pydantic import BaseModel
from app.services.gitops import (
    PipelineMonitor, get_pipeline_monitor,
    IncidentManager, get_incident_manager
)

router = APIRouter(prefix="/gitops", tags=["GitOps & Monitoring"])

@router.get("/pipeline/stats")
async def get_pipeline_stats(
    pid: str = Query("etl-canonical-ua"),
    monitor: PipelineMonitor = Depends(get_pipeline_monitor)
) -> Dict[str, Any]:
    """
    Returns health and performance metrics for a data pipeline (COMP-202).
    """
    return monitor.get_pipeline_status(pid)

@router.get("/incidents/active")
async def list_active_incidents(
    manager: IncidentManager = Depends(get_incident_manager)
) -> List[Dict[str, Any]]:
    """
    Lists current system and data incidents (COMP-211).
    """
    return manager.detect_incidents()

@router.post("/incidents/resolve/{incident_id}")
async def resolve_incident(
    incident_id: str,
    manager: IncidentManager = Depends(get_incident_manager)
) -> Dict[str, Any]:
    """
    Triggers automated resolution for an incident (COMP-211).
    """
    return manager.resolve_incident(incident_id)
