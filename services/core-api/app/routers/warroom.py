"""
WarRoom Router — PREDATOR Analytics v55.1 Ironclad.

Strategic analytics and investigative planning.
"""
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from app.services.warroom_service import WarRoomService
from app.dependencies import get_current_active_user, PermissionChecker
from app.core.permissions import Permission

router = APIRouter(prefix="/warroom", tags=["warroom"])

@router.post("/{ueid}/attack-plan")
async def create_attack_plan(
    ueid: str,
    context: Dict[str, Any] = {},
    user: Dict = Depends(PermissionChecker([Permission.VIEW_WARROOM]))
):
    """Генерація нового плану розслідування."""
    try:
        plan = await WarRoomService.generate_attack_plan(ueid, context)
        return {"ueid": ueid, "attack_plan": plan}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Attack plan generation failed: {str(e)}")
