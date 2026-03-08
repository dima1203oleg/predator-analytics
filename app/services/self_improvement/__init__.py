from functools import lru_cache
from .feedback_collector import FeedbackCollector
from .model_evaluator import ModelEvaluator
from .drift_detector import DriftDetector

@lru_cache()
def get_feedback_collector() -> FeedbackCollector:
    return FeedbackCollector()

@lru_cache()
def get_model_evaluator() -> ModelEvaluator:
    return ModelEvaluator()

@lru_cache()
def get_drift_detector() -> DriftDetector:
    return DriftDetector()

__all__ = [
    "FeedbackCollector", "get_feedback_collector",
    "ModelEvaluator", "get_model_evaluator",
    "DriftDetector", "get_drift_detector"
]
