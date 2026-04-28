"""WarRoom Router — PREDATOR Analytics v61.0-ELITE Ironclad.

Strategic analytics and investigative planning.
"""
from typing import Any

from fastapi import APIRouter, Depends, HTTPException

from app.core.permissions import Permission
from app.dependencies import PermissionChecker
from app.services.warroom_service import WarRoomService

router = APIRouter(prefix="/warroom", tags=["warroom"])

@router.post("/{ueid}/attack-plan")
async def create_attack_plan(
    ueid: str,
    context: dict[str, Any] | None = None,
    user: dict = Depends(PermissionChecker([Permission.VIEW_WARROOM]))
):
    """Генерація нового плану розслідування."""
    if context is None:
        context = {}
    try:
        plan = await WarRoomService.generate_attack_plan(ueid, context)
        return {"ueid": ueid, "attack_plan": plan}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Attack plan generation failed: {e!s}") from e
