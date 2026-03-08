from functools import lru_cache
from .mob_risk_scanner import MobRiskScanner
from .air_alarm_detector import AirAlarmDetector
from .cashflow_predictor import CashflowPredictor

@lru_cache()
def get_mob_risk_scanner() -> MobRiskScanner:
    return MobRiskScanner()

@lru_cache()
def get_air_alarm_detector() -> AirAlarmDetector:
    return AirAlarmDetector()

@lru_cache()
def get_cashflow_predictor() -> CashflowPredictor:
    return CashflowPredictor()

__all__ = [
    "MobRiskScanner", "get_mob_risk_scanner",
    "AirAlarmDetector", "get_air_alarm_detector",
    "CashflowPredictor", "get_cashflow_predictor"
]
