from fastapi import APIRouter, Depends, HTTPException
from typing import List, Any
from app.services.wargaming_engine import wargaming_engine
from app.routers.auth import get_current_active_user, get_tenant_id

router = APIRouter(prefix="/wargaming", tags=["War-gaming Engine"])

@router.get("/scenarios")
async def get_active_scenarios(
    tenant_id: str = Depends(get_tenant_id),
    current_user: dict = Depends(get_current_active_user)
):
    """Отримати список активних сценаріїв загроз."""
    return await wargaming_engine.generate_scenarios(tenant_id=tenant_id)

@router.post("/simulate/{scenario_id}")
async def simulate_scenario(
    scenario_id: str,
    tenant_id: str = Depends(get_tenant_id),
    current_user: dict = Depends(get_current_active_user)
):
    """Запустити симуляцію впливу сценарію."""
    return await wargaming_engine.simulate_impact(scenario_id)

@router.get("/forecast")
async def get_budget_forecast(
    tenant_id: str = Depends(get_tenant_id),
    current_user: dict = Depends(get_current_active_user)
):
    """Отримати прогноз впливу на бюджет на основі всіх активних загроз."""
    scenarios = await wargaming_engine.generate_scenarios(tenant_id=tenant_id)
    total_risk = sum(s['probability'] for s in scenarios) / len(scenarios) if scenarios else 0
    
    return {
        "risk_level": "HIGH" if total_risk > 70 else "MEDIUM" if total_risk > 40 else "LOW",
        "average_probability": round(total_risk, 1),
        "revenue_at_risk_mln": round(total_risk * 12.5, 2),
        "last_update": "Just now"
    }
