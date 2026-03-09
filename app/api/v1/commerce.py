from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Dict, Any, List
from pydantic import BaseModel
from app.services.commerce import (
    PricingEngine, get_pricing_engine,
    InventoryOptimizer, get_inventory_optimizer
)
from app.services.commerce.tft_forecast import TFTForecaster, get_tft_forecaster
from app.services.commerce.competitor_tracker import CompetitorPriceTracker, get_competitor_tracker

router = APIRouter(prefix="/commerce", tags=["Предиктивна Комерція"])

class PricingRequest(BaseModel):
    base_cost: float
    competitor_prices: List[float]
    demand_elasticity: float
    target_margin: float

class InventoryRequest(BaseModel):
    annual_demand: float
    ordering_cost: float
    holding_cost_rate: float
    unit_cost: float
    lead_time_days: float
    daily_demand_variance: float
    service_level_z: float = 1.65

@router.post("/pricing/recommend")
async def recommend_price(
    data: PricingRequest,
    engine: PricingEngine = Depends(get_pricing_engine)
) -> Dict[str, Any]:
    """
    Pricing Engine (COMP-258).
    Returns optimal price and strategy based on competitor context 
    and demand elasticity.
    """
    result = engine.recommend_price(
        base_cost=data.base_cost,
        competitor_prices=data.competitor_prices,
        demand_elasticity=data.demand_elasticity,
        target_margin=data.target_margin
    )
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@router.post("/inventory/optimize")
async def optimize_inventory(
    data: InventoryRequest,
    optimizer: InventoryOptimizer = Depends(get_inventory_optimizer)
) -> Dict[str, Any]:
    """
    Inventory Optimizer (COMP-256).
    Calculates Economic Order Quantity (EOQ), Safety Stock, 
    and Reorder Point.
    """
    result = optimizer.calculate_optimal_inventory(
        annual_demand=data.annual_demand,
        ordering_cost=data.ordering_cost,
        holding_cost_rate=data.holding_cost_rate,
        unit_cost=data.unit_cost,
        lead_time_days=data.lead_time_days,
        daily_demand_variance=data.daily_demand_variance,
        service_level_z=data.service_level_z
    )
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@router.get("/supply-chain/monitor")
async def supply_chain_monitor(ueid: str = Query(..., description="Target UEID")) -> Dict[str, Any]:
    """
    Supply Chain Monitor (COMP-260).
    Placeholder endpoint that will integrate with Customs APIs for 
    real-time supply chain disruption detection.
    """
    # Placeholder for future implementation combining customs data
    return {
        "ueid": ueid,
        "status": "Monitored",
        "disruption_risk": "Low",
        "active_suppliers": 24,
        "critical_alerts": []
    }

@router.get("/forecast/demand")
async def get_tft_demand_forecast(
    category_id: str = Query(..., description="Category ID to forecast"),
    horizon_days: int = Query(30, description="Forecast horizon in days"),
    forecaster: TFTForecaster = Depends(get_tft_forecaster)
) -> Dict[str, Any]:
    """
    Phase 14: TFT Forecast
    """
    return forecaster.predict_demand(category_id, horizon_days)

@router.get("/pricing/competitors")
async def track_competitor_prices(
    sku: str = Query(..., description="Target SKU"),
    tracker: CompetitorPriceTracker = Depends(get_competitor_tracker)
) -> Dict[str, Any]:
    """
    Phase 14: Competitor Price tracker
    """
    return tracker.get_competitor_prices(sku)
