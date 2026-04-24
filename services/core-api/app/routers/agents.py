"""PREDATOR Agents API Router
Endpoints для переліку автономних агентів (Legacy & New)
"""

from fastapi import APIRouter
from app.services.antigravity_orchestrator import orchestrator

router = APIRouter(prefix="/agents", tags=["agents"])

@router.get("")
@router.get("/")
async def get_all_agents():
    """Повертає список всіх підключених агентів (Sovereign & Antigravity)"""
    # Використовуємо дані з Antigravity Orchestrator
    return {"agents": orchestrator.get_status().model_dump()["agents"]}
