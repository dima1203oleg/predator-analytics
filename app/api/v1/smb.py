from typing import Any

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from app.services.smb import (
    AirAlarmDetector,
    CashflowPredictor,
    MobRiskScanner,
    get_air_alarm_detector,
    get_cashflow_predictor,
    get_mob_risk_scanner,
)

router = APIRouter(prefix="/smb", tags=["SMB Клієнтські Модулі"])

class MobRiskRequest(BaseModel):
    company_id: str
    personnel: list[dict[str, Any]]

class CashflowRequest(BaseModel):
    history: list[float]

@router.post("/risk/mobilization")
async def scan_mobilization_risk(
    data: MobRiskRequest,
    scanner: MobRiskScanner = Depends(get_mob_risk_scanner)
) -> dict[str, Any]:
    """Scans the mobilization vulnerability of a company's workforce (COMP-213).
    """
    return scanner.scan_risk(data.company_id, data.personnel)

@router.get("/security/air-alarm")
async def get_air_alarm_status(
    region: str = Query("Київ"),
    detector: AirAlarmDetector = Depends(get_air_alarm_detector)
) -> dict[str, Any]:
    """Gets real-time air alarm status and business impact assessment (COMP-214).
    """
    return detector.get_current_status(region)

@router.post("/finance/cashflow-forecast")
async def predict_cashflow(
    data: CashflowRequest,
    predictor: CashflowPredictor = Depends(get_cashflow_predictor)
) -> dict[str, Any]:
    """Predicts SMB cashflow for the next 3 months (COMP-216).
    """
    return predictor.predict_next_3_months(data.history)
