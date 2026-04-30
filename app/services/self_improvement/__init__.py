from functools import lru_cache

from .drift_detector import DriftDetector
from .feedback_collector import FeedbackCollector
from .model_evaluator import ModelEvaluator


@lru_cache
def get_feedback_collector() -> FeedbackCollector:
    return FeedbackCollector()

@lru_cache
def get_model_evaluator() -> ModelEvaluator:
    return ModelEvaluator()

@lru_cache
def get_drift_detector() -> DriftDetector:
    return DriftDetector()

__all__ = [
    "DriftDetector",
    "FeedbackCollector",
    "ModelEvaluator",
    "get_drift_detector",
    "get_feedback_collector",
    "get_model_evaluator"
]
