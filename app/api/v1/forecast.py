from datetime import datetime
from typing import List, Dict

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.settings import get_settings
from app.models.declaration import Declaration
from app.schemas.forecast import ForecastDemandRequest, ForecastResponse, ForecastModelsResponse
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
    # 1. Historical data (без SELECT *)
    stmt = (
        select(
            Declaration.declaration_date,
            Declaration.quantity,
            Declaration.product_name,
            Declaration.country_code,
        )
        .where(Declaration.product_code == request.product_code)
        .order_by(Declaration.declaration_date.desc())
        .limit(24)
    )

    result = await db.execute(stmt)
    rows = result.all()

    history_data: List[Dict[str, str | float]] = []
    product_name = None
    country_code = None

    for row in reversed(rows):
        date, quantity, p_name, c_code = row
        history_data.append({
            "date": date.isoformat() if isinstance(date, datetime) else str(date),
            "volume": float(quantity) if quantity is not None else 0.0,
        })
        if not product_name and p_name:
            product_name = p_name
        if not country_code and c_code:
            country_code = c_code

    # 2. Use ML service
    forecast_result = forecast_service.predict_demand(
        product_code=request.product_code,
        product_name=product_name,
        country_code=country_code,
        history_data=history_data if history_data else None,
        months_ahead=request.months_ahead,
        model_key=request.model
    )
    
    return forecast_result

@router.get("/models", response_model=ForecastModelsResponse)
async def list_models():
    """
    Список доступних моделей прогнозування.
    """
    settings = get_settings()
    return {"models": settings.FORECAST_MODELS}
