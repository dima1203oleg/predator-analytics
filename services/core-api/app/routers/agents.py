"""PREDATOR Agents API Router
Endpoints для переліку автономних агентів (Legacy & New)
"""

from fastapi import APIRouter
from app.routers.antigravity import STORAGE

router = APIRouter(prefix="/agents", tags=["agents"])

@router.get("")
@router.get("/")
async def get_all_agents():
    \"\"\"Повертає список всіх підключених агентів (Sovereign & Antigravity)\"\"\"
    # Використовуємо дані з Antigravity STORAGE
    return {"agents": STORAGE["status"]["agents"]}
