from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional

from predator_common.cers_score import CersFactors, compute_cers
from app.models.schemas import CersScoreResponse, RiskLevel, CersFactorResponse

router = APIRouter(prefix="/risk", tags=["risk"])

class CersComputationRequest(BaseModel):
    is_rnbo_sanctioned: bool = False
    is_eu_sanctioned: bool = False
    is_ofac_sanctioned: bool = False
    is_un_sanctioned: bool = False
    active_court_cases: int = 0
    lost_court_cases_ratio: float = 0.0
    offshore_connections: int = 0
    has_pep_links: bool = False
    customs_price_anomaly_count: int = 0
    customs_undervaluation_ratio: float = 0.0
    tax_debt_uah: float = 0.0
    bank_debt_days: int = 0


@router.post("/compute-cers", response_model=CersScoreResponse)
async def compute_cers_endpoint(payload: CersComputationRequest) -> CersScoreResponse:
    """Отримати CERS ризик для заданих факторів (FR-082)."""
    
    factors = CersFactors(
        is_rnbo_sanctioned=payload.is_rnbo_sanctioned,
        is_eu_sanctioned=payload.is_eu_sanctioned,
        is_ofac_sanctioned=payload.is_ofac_sanctioned,
        is_un_sanctioned=payload.is_un_sanctioned,
        active_court_cases=payload.active_court_cases,
        lost_court_cases_ratio=payload.lost_court_cases_ratio,
        offshore_connections=payload.offshore_connections,
        has_pep_links=payload.has_pep_links,
        customs_price_anomaly_count=payload.customs_price_anomaly_count,
        customs_undervaluation_ratio=payload.customs_undervaluation_ratio,
        tax_debt_uah=payload.tax_debt_uah,
        bank_debt_days=payload.bank_debt_days
    )
    
    result = compute_cers(factors)
    
    # Map raw dictionary to Pydantic responses
    factor_responses = []
    for factor_name, score in result.factors.items():
        if score > 0:
            factor_responses.append(
                CersFactorResponse(
                    name=factor_name,
                    contribution=score,
                    description=f"Внесок фактора {factor_name}"
                )
            )
            
    return CersScoreResponse(
        ueid="tmp-eval-ueid",  # Temporary for pure computation
        score=result.score,
        level=RiskLevel(result.level.value),
        factors=factor_responses,
        explanation=result.explanation
    )
