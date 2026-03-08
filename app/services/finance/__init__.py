from functools import lru_cache
from .valuation_engine import ValuationEngine
from .credit_risk_model import CreditRiskModel
from .portfolio_risk_manager import PortfolioRiskManager

@lru_cache()
def get_valuation_engine() -> ValuationEngine:
    return ValuationEngine()

@lru_cache()
def get_credit_risk_model() -> CreditRiskModel:
    return CreditRiskModel()

@lru_cache()
def get_portfolio_risk_manager() -> PortfolioRiskManager:
    return PortfolioRiskManager()

__all__ = [
    "ValuationEngine", "get_valuation_engine",
    "CreditRiskModel", "get_credit_risk_model",
    "PortfolioRiskManager", "get_portfolio_risk_manager"
]
