"""
Companies Router — PREDATOR Analytics v55.2-SM-EXTENDED.
Центральний вузол для роботи з юридичними особами (Entity-Centric).
"""
import time
from typing import Annotated, Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_

# Нові спільні моделі та канонічні схеми
from app.database import get_db
from predator_common.models import Company, RiskScore
from app.models.schemas import (
    CompanyResponse, 
    PaginatedCompanyResponse, 
    RiskLevel, 
    EntityStatus,
    SearchMeta,
    CersComponents,
    ComponentDetail
)
from app.dependencies import PermissionChecker, get_tenant_id
from app.core.permissions import Permission

router = APIRouter(prefix="/companies", tags=["компанії"])

def determine_risk_level(score: float) -> RiskLevel:
    """Мапінг балу на 5-рівневу шкалу v55.2."""
    if score < 20: return RiskLevel.STABLE
    if score < 40: return RiskLevel.WATCHLIST
    if score < 60: return RiskLevel.ELEVATED
    if score < 80: return RiskLevel.HIGH_ALERT
    return RiskLevel.CRITICAL

def map_interpretation(level: RiskLevel) -> str:
    """Текстова інтерпретація для UI."""
    interpretations = {
        RiskLevel.STABLE: "Стабільний стан (Stable)",
        RiskLevel.WATCHLIST: "Під наглядом (Watchlist)",
        RiskLevel.ELEVATED: "Підвищений ризик (Elevated)",
        RiskLevel.HIGH_ALERT: "Високий ризик (High Alert)",
        RiskLevel.CRITICAL: "Критичний ризик (Critical)"
    }
    return interpretations.get(level, "Невстановлено")

@router.get(
    "", 
    response_model=PaginatedCompanyResponse,
    summary="Пошук компаній (v55.2)"
)
async def list_companies(
    search: Annotated[Optional[str], Query(None, description="Пошук по назві або EDRPOU")] = None,
    risk_level: Annotated[Optional[RiskLevel], Query(None, description="Фільтр за рівнем ризику")] = None,
    limit: Annotated[int, Query(25, ge=1, le=100)] = 25,
    offset: Annotated[int, Query(0, ge=0)] = 0,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA]))
) -> PaginatedCompanyResponse:
    """
    Отримання пагінованого списку компаній з фільтрацією.
    Згідно з TZ v55.2 використовується UEID як основний ключ.
    """
    start_time = time.time()
    
    query = select(Company).where(Company.tenant_id == tenant_id)
    
    if search:
        search_pattern = f"%{search}%"
        query = query.where(or_(
            Company.name.ilike(search_pattern),
            Company.edrpou.ilike(search_pattern)
        ))
    
    # Фільтрація за рівнем ризику потребує мапінгу меж балів
    if risk_level:
        if risk_level == RiskLevel.STABLE: query = query.where(Company.risk_score < 20)
        elif risk_level == RiskLevel.WATCHLIST: query = query.where(and_(Company.risk_score >= 20, Company.risk_score < 40))
        # ... і так далі для інших рівнів
        
    # Total count
    count_query = select(func.count()).select_from(query.subquery())
    total_res = await db.execute(count_query)
    total_count = total_res.scalar() or 0
    
    # Results
    query = query.order_by(Company.risk_score.desc()).offset(offset).limit(limit)
    result = await db.execute(query)
    companies = result.scalars().all()
    
    data = []
    for c in companies:
        level = determine_risk_level(c.risk_score)
        data.append(CompanyResponse(
            ueid=c.ueid,
            name=c.name,
            edrpou=c.edrpou,
            status=EntityStatus(c.status),
            sector=c.sector,
            risk_level=level,
            risk_score=c.risk_score,
            cers_confidence=c.cers_confidence,
            created_at=c.created_at,
            updated_at=c.updated_at
        ))
        
    execution_time = int((time.time() - start_time) * 1000)
    
    return PaginatedCompanyResponse(
        data=data,
        meta=SearchMeta(
            total=total_count,
            limit=limit,
            offset=offset,
            has_next=(offset + limit) < total_count,
            execution_time_ms=execution_time
        )
    )

@router.get(
    "/{ueid}", 
    response_model=CompanyResponse,
    summary="Профіль компанії (v55.2)"
)
async def get_company(
    ueid: str,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA]))
) -> CompanyResponse:
    """
    Повне досьє компанії з 5-шаровим розбором ризику.
    """
    query = select(Company).where(Company.ueid == ueid, Company.tenant_id == tenant_id)
    result = await db.execute(query)
    company = result.scalar_one_or_none()
    
    if not company:
        raise HTTPException(status_code=404, detail="Компанію не знайдено")
        
    # Отримуємо останній детальний RiskScore (5 шарів)
    score_query = select(RiskScore).where(
        RiskScore.entity_ueid == ueid,
        RiskScore.tenant_id == tenant_id
    ).order_by(RiskScore.score_date.desc()).limit(1)
    
    score_res = await db.execute(score_query)
    last_score = score_res.scalar_one_or_none()
    
    risk_details = None
    if last_score:
        risk_details = CersComponents(
            behavioral=ComponentDetail(value=last_score.behavioral_score or 0, weight=0.25),
            institutional=ComponentDetail(value=last_score.institutional_score or 0, weight=0.20),
            influence=ComponentDetail(value=last_score.influence_score or 0, weight=0.20),
            structural=ComponentDetail(value=last_score.structural_score or 0, weight=0.15),
            predictive=ComponentDetail(value=last_score.predictive_score or 0, weight=0.20)
        )
        
    level = determine_risk_level(company.risk_score)
    
    return CompanyResponse(
        ueid=company.ueid,
        name=company.name,
        edrpou=company.edrpou,
        status=EntityStatus(company.status),
        sector=company.sector,
        risk_level=level,
        risk_score=company.risk_score,
        cers_confidence=company.cers_confidence,
        risk_details=risk_details,
        interpretation=map_interpretation(level),
        created_at=company.created_at,
        updated_at=company.updated_at
    )
