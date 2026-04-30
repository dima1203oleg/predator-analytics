from functools import lru_cache

from .credit_risk_model import CreditRiskModel
from .ma_scanner import MAScanner


@lru_cache
def get_ma_scanner() -> MAScanner:
    return MAScanner()

@lru_cache
def get_credit_risk_model() -> CreditRiskModel:
    return CreditRiskModel()

__all__ = [
    "CreditRiskModel",
    "MAScanner",
    "get_credit_risk_model",
    "get_ma_scanner"
]
