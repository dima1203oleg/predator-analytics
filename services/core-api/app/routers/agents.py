"""PREDATOR Agents API Router
Endpoints для переліку автономних агентів (Legacy & New)
"""

from fastapi import APIRouter, Depends
from app.services.antigravity_orchestrator import orchestrator
from app.dependencies import PermissionChecker
from app.core.permissions import Permission

router = APIRouter(prefix="/agents", tags=["agents"])

@router.get("")
@router.get("/")
async def get_all_agents(
    current_user: dict = Depends(PermissionChecker([Permission.RUN_ANALYTICS]))
):
    """Повертає список всіх підключених агентів (Sovereign & Antigravity)"""
    # Використовуємо дані з Antigravity Orchestrator
    return {"agents": orchestrator.get_status().model_dump()["agents"]}
