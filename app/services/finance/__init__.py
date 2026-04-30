from functools import lru_cache

from .credit_risk_model import CreditRiskModel
from .portfolio_risk_manager import PortfolioRiskManager
from .valuation_engine import ValuationEngine


@lru_cache
def get_valuation_engine() -> ValuationEngine:
    return ValuationEngine()

@lru_cache
def get_credit_risk_model() -> CreditRiskModel:
    return CreditRiskModel()

@lru_cache
def get_portfolio_risk_manager() -> PortfolioRiskManager:
    return PortfolioRiskManager()

__all__ = [
    "CreditRiskModel",
    "PortfolioRiskManager",
    "ValuationEngine",
    "get_credit_risk_model",
    "get_portfolio_risk_manager",
    "get_valuation_engine"
]
