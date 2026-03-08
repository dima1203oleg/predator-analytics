from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.forecast import ForecastDemandRequest, ForecastResponse, ForecastModelsResponse
from datetime import datetime, timedelta
import random

from app.services.ml.forecast_service import get_forecast_service, ForecastService

router = APIRouter(prefix="/forecast", tags=["Прогнозування"])

@router.post("/demand", response_model=ForecastResponse)
async def get_demand_forecast(
    request: ForecastDemandRequest,
    db: AsyncSession = Depends(get_db),
    forecast_service: ForecastService = Depends(get_forecast_service)
):
    """
    Отримати прогноз попиту для товару.
    """
    # 1. Fetch historical data from DB if possible
    # query = select(Declaration).where(Declaration.product_code == request.product_code)
    # result = await db.execute(query)
    # ... logic to convert to history_data list ...
    
    # 2. Use ML service
    forecast_result = forecast_service.predict_demand(
        product_code=request.product_code,
        history_data=None, # In production: pass real historical rows here
        months_ahead=request.months_ahead,
        model_key=request.model
    )
    
    return forecast_result

@router.get("/models", response_model=ForecastModelsResponse)
async def list_models():
    """
    Список доступних моделей прогнозування.
    """
    return {
        "models": [
            {"key": "prophet", "name_uk": "FB Prophet (Base)", "description_uk": "Статистична модель часових рядів"},
            {"key": "xgboost", "name_uk": "XGBoost Regressor", "description_uk": "Градієнтний бустинг для складних патернів"},
            {"key": "ensemble", "name_uk": "Ensemble (Prophet + XGBoost)", "description_uk": "Ансамбль моделей з максимальною точністю"}
        ]
    }
