from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Dict, Any, List
from pydantic import BaseModel
from app.services.smb import (
    MobRiskScanner, get_mob_risk_scanner,
    AirAlarmDetector, get_air_alarm_detector,
    CashflowPredictor, get_cashflow_predictor
)

router = APIRouter(prefix="/smb", tags=["SMB Клієнтські Модулі"])

class MobRiskRequest(BaseModel):
    company_id: str
    personnel: List[Dict[str, Any]]

class CashflowRequest(BaseModel):
    history: List[float]

@router.post("/risk/mobilization")
async def scan_mobilization_risk(
    data: MobRiskRequest,
    scanner: MobRiskScanner = Depends(get_mob_risk_scanner)
) -> Dict[str, Any]:
    """
    Scans the mobilization vulnerability of a company's workforce (COMP-213).
    """
    return scanner.scan_risk(data.company_id, data.personnel)

@router.get("/security/air-alarm")
async def get_air_alarm_status(
    region: str = Query("Київ"),
    detector: AirAlarmDetector = Depends(get_air_alarm_detector)
) -> Dict[str, Any]:
    """
    Gets real-time air alarm status and business impact assessment (COMP-214).
    """
    return detector.get_current_status(region)

@router.post("/finance/cashflow-forecast")
async def predict_cashflow(
    data: CashflowRequest,
    predictor: CashflowPredictor = Depends(get_cashflow_predictor)
) -> Dict[str, Any]:
    """
    Predicts SMB cashflow for the next 3 months (COMP-216).
    """
    return predictor.predict_next_3_months(data.history)
