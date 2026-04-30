from functools import lru_cache

from .air_alarm_detector import AirAlarmDetector
from .cashflow_predictor import CashflowPredictor
from .mob_risk_scanner import MobRiskScanner


@lru_cache
def get_mob_risk_scanner() -> MobRiskScanner:
    return MobRiskScanner()

@lru_cache
def get_air_alarm_detector() -> AirAlarmDetector:
    return AirAlarmDetector()

@lru_cache
def get_cashflow_predictor() -> CashflowPredictor:
    return CashflowPredictor()

__all__ = [
    "AirAlarmDetector",
    "CashflowPredictor",
    "MobRiskScanner",
    "get_air_alarm_detector",
    "get_cashflow_predictor",
    "get_mob_risk_scanner"
]
