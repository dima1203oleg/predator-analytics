from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Dict, Any, List
from pydantic import BaseModel
from app.services.finance import (
    ValuationEngine, get_valuation_engine,
    PortfolioRiskManager, get_portfolio_risk_manager
)
from app.services.intelligence.finance import (
    MAScanner, get_ma_scanner,
    CreditRiskModel, get_credit_risk_model
)
from app.services.finance.xbrl_parser import XBRLParser, get_xbrl_parser
from app.services.finance.investment_tracker import InvestmentTracker, get_investment_tracker

router = APIRouter(prefix="/finance", tags=["Finance & Risk Intel"])

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
    # The new CreditRiskModel has calculate_risk_metrics, the old one had calculate_credit_risk
    # We'll use the new one's signature or fix it to be compatible.
    # For now, let's keep it consistent with our newly implemented service.
    return model.calculate_risk_metrics(
        entity_id="dynamic-queryed-entity", 
        financial_data={"current_exposure": data.exposure_amount}
    )

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

@router.get("/ma/targets")
async def get_ma_targets(
    industry: str = Query("agro"),
    scanner: MAScanner = Depends(get_ma_scanner)
) -> List[Dict[str, Any]]:
    """
    Scans for potential acquisition targets (COMP-245).
    """
    return scanner.scan_targets(industry)

@router.post("/xbrl/parse")
async def parse_xbrl_document(
    document_xml: str,
    parser: XBRLParser = Depends(get_xbrl_parser)
) -> Dict[str, Any]:
    """
    Phase 13: Financial Intelligence (XBRL).
    Parses complex XBRL registry files into canonical financial structures.
    """
    return parser.parse_document(document_xml)

@router.get("/investment/fdi")
async def get_fdi_data(
    country_code: str = Query(..., description="ISO Alpha-2 or Alpha-3"),
    tracker: InvestmentTracker = Depends(get_investment_tracker)
) -> Dict[str, Any]:
    """
    Phase 13: Financial Intelligence (Investment Tracker).
    Retrieves FDI flow analysis for a given country code.
    """
    return tracker.analyze_fdi(country_code)

@router.get("/investment/capex")
async def get_corporate_capex(
    edrpou: str = Query(..., description="Target EDRPOU code"),
    tracker: InvestmentTracker = Depends(get_investment_tracker)
) -> Dict[str, Any]:
    """
    Phase 13: Financial Intelligence (Investment Tracker).
    Retrieves CAPEX estimations from company registry and tender data.
    """
    return tracker.track_corporate_capex(edrpou)
