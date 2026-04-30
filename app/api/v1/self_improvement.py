from typing import Any

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from app.services.self_improvement import (
    DriftDetector,
    FeedbackCollector,
    ModelEvaluator,
    get_drift_detector,
    get_feedback_collector,
    get_model_evaluator,
)

router = APIRouter(prefix="/self-improve", tags=["Самоаналіз та Розвиток"])

class FeedbackRequest(BaseModel):
    prediction_id: str
    user_id: str
    is_accurate: bool
    correction: str = None
    comments: str = None

class DriftRequest(BaseModel):
    feature_name: str
    baseline_mean: float
    current_mean: float
    threshold: float = 0.1

class ABTestRequest(BaseModel):
    experiment_id: str
    model_a: str
    model_b: str
    traffic_split: float = 0.5

@router.post("/feedback/log")
async def log_feedback(
    data: FeedbackRequest,
    collector: FeedbackCollector = Depends(get_feedback_collector)
) -> dict[str, Any]:
    """Logs feedback on a model's prediction to improve accuracy over time (COMP-195).
    """
    return collector.log_feedback(
        prediction_id=data.prediction_id,
        user_id=data.user_id,
        is_accurate=data.is_accurate,
        correction=data.correction,
        comments=data.comments
    )

@router.get("/feedback/stats")
async def get_feedback_stats(
    collector: FeedbackCollector = Depends(get_feedback_collector)
) -> dict[str, Any]:
    """Retrieves global accuracy metrics calculated from operator feedback.
    """
    return collector.get_accuracy_stats()

@router.post("/drift/detect")
async def detect_feature_drift(
    data: DriftRequest,
    detector: DriftDetector = Depends(get_drift_detector)
) -> dict[str, Any]:
    """Detects if incoming production data distribution has drifted significantly (COMP-197).
    """
    return detector.detect_data_drift(
        feature_name=data.feature_name,
        baseline_mean=data.baseline_mean,
        current_mean=data.current_mean,
        threshold=data.threshold
    )

@router.post("/ab-test/start")
async def start_ab_test(
    data: ABTestRequest,
    evaluator: ModelEvaluator = Depends(get_model_evaluator)
) -> dict[str, Any]:
    """Initializes a new A/B test between two models (COMP-196).
    """
    return evaluator.start_ab_test(
        experiment_id=data.experiment_id,
        model_a=data.model_a,
        model_b=data.model_b,
        traffic_split=data.traffic_split
    )

@router.get("/ab-test/route")
async def route_ab_test(
    experiment_id: str = Query(...),
    evaluator: ModelEvaluator = Depends(get_model_evaluator)
) -> dict[str, Any]:
    """Routes a request dynamically to the proper model in an active A/B test.
    """
    model = evaluator.route_request(experiment_id)
    return {"experiment_id": experiment_id, "selected_model": model}
