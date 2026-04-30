"""Admin Chaos Router — PREDATOR Analytics v61.0-ELITE.

Керування експериментами Хаосу. Тільки для ролі ADMIN.
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.core.permissions import Permission
from app.dependencies import PermissionChecker
from app.services.chaos_service import ChaosService

router = APIRouter(prefix="/admin/chaos", tags=["Адміністрування (Chaos)"])

class ChaosRequest(BaseModel):
    experiment_name: str
    active: bool

@router.post("/trigger", summary="Запуск/зупинка хаос-експерименту")
async def trigger_chaos(
    request: ChaosRequest,
    _ = Depends(PermissionChecker([Permission.MANAGE_USERS]))
):
    """Активувати або деактивувати хаос-ефект."""
    ChaosService.set_experiment(request.experiment_name, request.active)
    return {"status": "ok", "active_experiments": ChaosService.get_status()}

@router.get("/status", summary="Статус хаос-експериментів")
async def get_chaos_status(
    _ = Depends(PermissionChecker([Permission.MANAGE_USERS]))
):
    """Переглянути статус усіх експериментів."""
    return ChaosService.get_status()
