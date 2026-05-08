
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.dependencies import get_current_active_user, get_tenant_id
from app.services.wargaming_engine import wargaming_engine

router = APIRouter(prefix="/wargaming", tags=["War-gaming Engine"])


class ScenarioItem(BaseModel):
    id: str
    name: str
    probability: float
    impact_uah_mln: float


class MonteCarloRequest(BaseModel):
    scenarios: list[ScenarioItem]
    iterations: int = Field(default=1000, ge=1, le=10000)

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
    return await wargaming_engine.simulate_scenario(scenario_id)

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


@router.post("/monte-carlo")
async def run_monte_carlo(
    payload: MonteCarloRequest,
    tenant_id: str = Depends(get_tenant_id),
    current_user: dict = Depends(get_current_active_user)
):
    """Запустити пряму симуляцію Монте-Карло для набору сценаріїв."""
    total_expected = 0
    p95_total = 0
    p99_total = 0

    for scenario in payload.scenarios:
        res = await wargaming_engine.simulator.run_simulation(
            base_loss=scenario.impact_uah_mln,
            probability=scenario.probability,
            iterations=payload.iterations
        )
        total_expected += res["mean"]
        p95_total += res["p95"]
        p99_total += res["p99"]

    return {
        "expected_impact_mln": round(total_expected, 2),
        "p95_impact_mln": round(p95_total, 2),
        "p99_impact_mln": round(p99_total, 2),
        "iterations": payload.iterations,
        "scenarios_processed": len(payload.scenarios)
    }
