from functools import lru_cache

from .export_risk_analyzer import ExportRiskAnalyzer
from .harvest_predictor import HarvestPredictor


@lru_cache
def get_harvest_predictor() -> HarvestPredictor:
    return HarvestPredictor()

@lru_cache
def get_export_risk_analyzer() -> ExportRiskAnalyzer:
    return ExportRiskAnalyzer()

__all__ = [
    "ExportRiskAnalyzer",
    "HarvestPredictor",
    "get_export_risk_analyzer",
    "get_harvest_predictor"
]
