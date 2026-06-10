from fastapi import APIRouter
from services.adv_dvs.validator import ADVValidator

router = APIRouter()

@router.post("/run")
async def run_validation():
    """Запускає валідацію всіх рівнів ADV-DVS та повертає результат у JSON."""
    result = ADVValidator.run_all()
    return result
