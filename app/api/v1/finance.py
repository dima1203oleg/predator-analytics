from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, List
from pydantic import BaseModel
from app.services.finance import (
    ValuationEngine, get_valuation_engine,
    CreditRiskModel, get_credit_risk_model,
    PortfolioRiskManager, get_portfolio_risk_manager
)

router = APIRouter(prefix="/finance", tags=["Фінансовий Інтелект"])

# Reusable models for validation
class DcfRequest(BaseModel):
    free_cash_flows: List[float]
    discount_rate: float
    terminal_growth_rate: float
    shares_outstanding: int

class CreditRiskRequest(BaseModel):
    pd_percent: float
    exposure_amount: float
    collateral_value: float = 0.0
    ccf: float = 1.0

class VarRequest(BaseModel):
    returns: List[float]
    portfolio_value: float
    
@router.post("/valuation/dcf")
async def calculate_dcf(
    data: DcfRequest,
    engine: ValuationEngine = Depends(get_valuation_engine)
) -> Dict[str, Any]:
    """
    Computes company valuation using Discounted Cash Flow (DCF).
    """
    result = engine.calculate_dcf(
        free_cash_flows=data.free_cash_flows,
        discount_rate=data.discount_rate,
        terminal_growth_rate=data.terminal_growth_rate,
        shares_outstanding=data.shares_outstanding
    )
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@router.post("/credit-risk/calculate")
async def calculate_credit_risk(
    data: CreditRiskRequest,
    model: CreditRiskModel = Depends(get_credit_risk_model)
) -> Dict[str, Any]:
    """
    Calculates Credit Risk Metrics (PD, LGD, EAD, Expected Loss).
    """
    result = model.calculate_credit_risk(
        default_probability_percent=data.pd_percent,
        exposure_amount=data.exposure_amount,
        collateral_value=data.collateral_value,
        credit_conversion_factor=data.ccf
    )
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@router.post("/portfolio-risk/var")
async def calculate_var(
    data: VarRequest,
    manager: PortfolioRiskManager = Depends(get_portfolio_risk_manager)
) -> Dict[str, Any]:
    """
    Calculates Value at Risk (VaR) using Historical Simulation.
    """
    result = manager.calculate_historical_var(
        returns=data.returns,
        portfolio_value=data.portfolio_value
    )
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@router.post("/portfolio-risk/stress-test")
async def calculate_stress_test(
    current_value: float,
    shock_scenarios: Dict[str, float],
    manager: PortfolioRiskManager = Depends(get_portfolio_risk_manager)
) -> Dict[str, Any]:
    """
    Performs portfolio stress testing against defined shock scenarios.
    """
    return manager.stress_test(
        current_value=current_value,
        shock_scenarios=shock_scenarios
    )
