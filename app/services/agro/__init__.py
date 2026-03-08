from functools import lru_cache
from .harvest_predictor import HarvestPredictor
from .export_risk_analyzer import ExportRiskAnalyzer

@lru_cache()
def get_harvest_predictor() -> HarvestPredictor:
    return HarvestPredictor()

@lru_cache()
def get_export_risk_analyzer() -> ExportRiskAnalyzer:
    return ExportRiskAnalyzer()

__all__ = [
    "HarvestPredictor", "get_harvest_predictor",
    "ExportRiskAnalyzer", "get_export_risk_analyzer"
]
