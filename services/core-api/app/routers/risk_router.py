from fastapi import APIRouter, Depends, HTTPException
from app.services.risk.risk_service import RiskService
from app.models.risk import RiskAssessment

router = APIRouter(prefix="/api/risk", tags=["risk"])


@router.post("/assess", response_model=RiskAssessment)
async def assess_risk(company_id: str):
    """Оцінка ризику для компанії."""
    risk_assessment = await RiskService.assess_risk(company_id)
    if not risk_assessment:
        raise HTTPException(status_code=404, detail="Company not found")
    return risk_assessment