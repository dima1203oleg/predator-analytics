from pydantic import BaseModel


class RiskAssessment(BaseModel):
    company_id: str
    risk_score: float
    risk_level: str  # "low", "medium", "high"