"""Forecast Router — PREDATOR Analytics v56.5-ELITE.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.services.forecast_service import ForecastService
from app.dependencies import PermissionChecker
from app.core.permissions import Permission

router = APIRouter(prefix="/forecast", tags=["Стратегічна Аналітика (ML)"])

class ForecastRequest(BaseModel):
    product_code: str
    months_ahead: int = 6
    model: str = "prophet"

@router.post("/demand", summary="Отримати прогноз попиту")
async def get_demand_forecast(
    request: ForecastRequest,
    _ = Depends(PermissionChecker([Permission.ANALYTICS_READ]))
):
    """Генерує ML-прогноз для вказаного товару."""
    try:
        return await ForecastService.get_demand_forecast(
            product_code=request.product_code,
            months_ahead=request.months_ahead,
            model=request.model
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/models", summary="Доступні моделі прогнозування")
async def get_models(
    _ = Depends(PermissionChecker([Permission.ANALYTICS_READ]))
):
    """Повертає список доступних алгоритмів."""
    models = await ForecastService.get_available_models()
    return {"models": models}
