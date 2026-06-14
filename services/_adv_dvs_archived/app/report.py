from fastapi import APIRouter
from services.adv_dvs.validator import ADVValidator

router = APIRouter()

@router.get("/report")
async def get_report():
    """Повертає останній звіт валідації ADV-DVS."""
    result = ADVValidator().run_all()
    return result
