from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Dict, Any, List
from pydantic import BaseModel
from app.services.agro import (
    HarvestPredictor, get_harvest_predictor,
    ExportRiskAnalyzer, get_export_risk_analyzer
)

router = APIRouter(prefix="/agro", tags=["Agro-Industrial Complex (АПК)"])

class HarvestRequest(BaseModel):
    field_id: str
    crop_type: str
    sensors: Dict[str, float]

@router.post("/harvest/predict")
async def predict_crop_yield(
    data: HarvestRequest,
    predictor: HarvestPredictor = Depends(get_harvest_predictor)
) -> Dict[str, Any]:
    """
    Predicts harvest yield using environmental data (COMP-221).
    """
    return predictor.predict_yield(data.field_id, data.crop_type, data.sensors)

@router.get("/export/risk")
async def get_export_risk(
    route: str = Query("Odessa-Bosphorus"),
    analyzer: ExportRiskAnalyzer = Depends(get_export_risk_analyzer)
) -> Dict[str, Any]:
    """
    Analyzes risks for agricultural exports (COMP-223).
    """
    return analyzer.analyze_route(route)
