"""ADV DVS: API Router."""
from fastapi import APIRouter
from typing import Dict, Any

from services.adv_dvs.orchestrator import ADVOrchestrator

router = APIRouter()

@router.get("/run", summary="Run Full ADV DVS Validation", response_model=Dict[str, Any])
async def run_adv_dvs_validation() -> Dict[str, Any]:
    """
    Запускає повну валідацію ADV DVS (Level 1 + Level 2).
    Повертає фінальний звіт у форматі JSON.
    """
    orchestrator = ADVOrchestrator()
    report = await orchestrator.run_full_validation()
    return report
