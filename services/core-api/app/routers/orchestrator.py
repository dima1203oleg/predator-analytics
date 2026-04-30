"""Orchestrator Router — PREDATOR Analytics v61.0-ELITE.

API для управління інфраструктурними компонентами.
"""


from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.permissions import Permission
from app.dependencies import PermissionChecker
from app.services.orchestrator_service import PodStatus, orchestrator_service

router = APIRouter(prefix="/orchestrator", tags=["Оркестрація"])

class ScaleRequest(BaseModel):
    delta: int

@router.get("/pods", response_model=list[PodStatus])
async def list_pods(
    _ = Depends(PermissionChecker([Permission.MANAGE_USERS]))
):
    """Отримати список усіх керованих подів."""
    return await orchestrator_service.get_pods()

@router.post("/pods/{pod_id}/restart")
async def restart_pod(
    pod_id: str,
    _ = Depends(PermissionChecker([Permission.MANAGE_USERS]))
):
    """Перезапустити вказаний под."""
    success = await orchestrator_service.restart_pod(pod_id)
    if not success:
        raise HTTPException(status_code=404, detail="Pod not found")
    return {"status": "ok", "message": f"Pod {pod_id} restart initiated"}

@router.post("/pods/{pod_id}/scale")
async def scale_pod(
    pod_id: str,
    request: ScaleRequest,
    _ = Depends(PermissionChecker([Permission.MANAGE_USERS]))
):
    """Змінити кількість реплік пода (масштабування)."""
    success = await orchestrator_service.scale_pod(pod_id, request.delta)
    if not success:
        raise HTTPException(status_code=404, detail="Pod not found")
    return {"status": "ok", "message": f"Pod {pod_id} scale updated by {request.delta}"}

@router.post("/pods/{pod_id}/scale-down")
async def scale_down_pod(
    pod_id: str,
    _ = Depends(PermissionChecker([Permission.MANAGE_USERS]))
):
    """Зменшити кількість реплік на 1."""
    success = await orchestrator_service.scale_pod(pod_id, -1)
    if not success:
        raise HTTPException(status_code=404, detail="Pod not found")
    return {"status": "ok", "message": f"Pod {pod_id} scaled down by 1"}
