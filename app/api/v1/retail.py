from fastapi import APIRouter, Depends, Query
from typing import Dict, Any, List
from pydantic import BaseModel
from app.services.retail import (
    ReviewAnalyzer, get_review_analyzer,
    TrendPredictor, get_trend_predictor
)

router = APIRouter(prefix="/retail", tags=["Retail & Fashion Modules"])

class ReviewRequest(BaseModel):
    items: List[str]

@router.post("/analysis/reviews")
async def analyze_customer_reviews(
    data: ReviewRequest,
    analyzer: ReviewAnalyzer = Depends(get_review_analyzer)
) -> Dict[str, Any]:
    """
    Analyzes customer feedback for retail (COMP-220).
    """
    return analyzer.analyze_reviews(data.items)

@router.get("/trends/predict")
async def get_market_trends(
    cat: str = Query("fashion"),
    predictor: TrendPredictor = Depends(get_trend_predictor)
) -> Dict[str, Any]:
    """
    Predicts upcoming retail and fashion trends (COMP-253).
    """
    return predictor.predict_trends(cat)
