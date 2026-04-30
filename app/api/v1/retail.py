from typing import Any

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from app.services.retail import (
    ReviewAnalyzer,
    TrendPredictor,
    get_review_analyzer,
    get_trend_predictor,
)

router = APIRouter(prefix="/retail", tags=["Retail & Fashion Modules"])

class ReviewRequest(BaseModel):
    items: list[str]

@router.post("/analysis/reviews")
async def analyze_customer_reviews(
    data: ReviewRequest,
    analyzer: ReviewAnalyzer = Depends(get_review_analyzer)
) -> dict[str, Any]:
    """Analyzes customer feedback for retail (COMP-220).
    """
    return analyzer.analyze_reviews(data.items)

@router.get("/trends/predict")
async def get_market_trends(
    cat: str = Query("fashion"),
    predictor: TrendPredictor = Depends(get_trend_predictor)
) -> dict[str, Any]:
    """Predicts upcoming retail and fashion trends (COMP-253).
    """
    return predictor.predict_trends(cat)
