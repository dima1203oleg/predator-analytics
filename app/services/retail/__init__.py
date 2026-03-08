from functools import lru_cache
from .review_analyzer import ReviewAnalyzer
from .trend_predictor import TrendPredictor

@lru_cache()
def get_review_analyzer() -> ReviewAnalyzer:
    return ReviewAnalyzer()

@lru_cache()
def get_trend_predictor() -> TrendPredictor:
    return TrendPredictor()

__all__ = [
    "ReviewAnalyzer", "get_review_analyzer",
    "TrendPredictor", "get_trend_predictor"
]
