"""
Risk Router — PREDATOR Analytics v55.2-SM-EXTENDED.

Оцінка ризиків та п'ятирівневих CERS індексів (Behavioral, Institutional, Influence, Structural, Predictive).
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, in_

from app.database import get_db
# Використовуємо спільні моделі v55.2
from predator_common.models import Company, RiskScore
from app.dependencies import PermissionChecker, get_tenant_id
from app.core.permissions import Permission

router = APIRouter(prefix="/risk", tags=["risk"])

# --- Моделі відповідей v55.2 ---
from app.models.schemas import (
    CompanyResponse,
    RiskLevel,
    EntityStatus,
    CersComponents,
    ComponentDetail,
    Uncertainty
)

# Для сумісності з risk.py, якщо потрібна специфічна модель для масового запиту
class KeyDriver(BaseModel):
    driver: str
    contribution: float

class EntityRiskScore(BaseModel):
    entity_ueid: str
    entity_name: str
    cers: float
    confidence: float
    components: CersComponents
    interpretation: str
    key_drivers: List[KeyDriver]
    uncertainty: Uncertainty
    forecast_30d: float
    forecast_90d: float
    
class RiskScoreResponse(BaseModel):
    scores: List[EntityRiskScore]
    cached: bool = False
    calculation_time_ms: int = 0


def determine_interpretation(cers: float) -> str:
    """Визначає текстову інтерпретацію ризику."""
    if cers < 20:
        return "Стабільний стан (Stable)"
    elif cers < 40:
        return "Під наглядом (Watchlist)"
    elif cers < 60:
        return "Підвищений ризик (Elevated)"
    elif cers < 80:
        return "Високий ризик (High Alert)"
    return "Критичний ризик (Critical)"


@router.get("/score", response_model=RiskScoreResponse)
async def get_risk_scores(
    entities: str = Query(..., description="Кома-сепаровані списки UEID (напр., uuid1,uuid2)"),
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.READ_COMPANIES]))
):
    """
    Отримати 5-рівневий CERS базис для компанії згідно v55.2-SM-EXTENDED.
    """
    start_time = datetime.utcnow()
    
    ueids = [ueid.strip() for ueid in entities.split(",") if ueid.strip()]
    
    if not ueids:
        raise HTTPException(status_code=400, detail="Не вказано entities")
        
    # Звертаємося до бази для отримання компаній та їхніх останніх риск-скорів
    companies_query = select(Company).where(
        Company.tenant_id == tenant_id,
        Company.ueid.in_(ueids)
    )
    companies_result = await db.execute(companies_query)
    companies = {c.ueid: c for c in companies_result.scalars().all()}
    
    scores_query = select(RiskScore).where(
        RiskScore.tenant_id == tenant_id,
        RiskScore.entity_ueid.in_(ueids)
    ).order_by(RiskScore.entity_ueid, RiskScore.score_date.desc())
    
    # Спрощений вибір останнього скору для кожної компанії
    scores_result = await db.execute(scores_query)
    scores_list = scores_result.scalars().all()
    
    latest_scores = {}
    for s in scores_list:
        if s.entity_ueid not in latest_scores:
            latest_scores[s.entity_ueid] = s
            
    response_scores = []
    
    for ueid in ueids:
        company = companies.get(ueid)
        if not company:
            continue
            
        score_record = latest_scores.get(ueid)
        if not score_record:
            # Заглушка, якщо оцінки відсутні (у реальності Triggered Async)
            continue
            
        # Формування результату за структурою v55.2
        response_scores.append(EntityRiskScore(
            entity_ueid=ueid,
            entity_name=company.name,
            cers=score_record.cers,
            confidence=score_record.cers_confidence,
            components=CersComponents(
                behavioral=ComponentDetail(value=score_record.behavioral_score or 0, weight=0.25),
                institutional=ComponentDetail(value=score_record.institutional_score or 0, weight=0.20),
                influence=ComponentDetail(value=score_record.influence_score or 0, weight=0.20),
                structural=ComponentDetail(value=score_record.structural_score or 0, weight=0.15),
                predictive=ComponentDetail(value=score_record.predictive_score or 0, weight=0.20)
            ),
            interpretation=determine_interpretation(score_record.cers),
            key_drivers=[KeyDriver(**flag) for flag in score_record.flags] if score_record.flags else [],
            uncertainty=Uncertainty(
                lower=max(0, score_record.cers - 5),
                upper=min(100, score_record.cers + 5)
            ),
            forecast_30d=score_record.predictive_score or score_record.cers,
            forecast_90d=(score_record.predictive_score or score_record.cers) * 1.05
        ))
        
    calc_time = int((datetime.utcnow() - start_time).total_seconds() * 1000)

    return RiskScoreResponse(
        scores=response_scores,
        cached=True,
        calculation_time_ms=calc_time
    )

