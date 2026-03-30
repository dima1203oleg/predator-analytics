"""Companies Router — PREDATOR Analytics v55.2-SM-EXTENDED.
Центральний вузол для роботи з юридичними особами (Entity-Centric).
"""
import time
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import Permission

# Нові спільні моделі та канонічні схеми
from app.database import get_db
from app.dependencies import PermissionChecker, get_tenant_id
from app.models.schemas import (
    CersComponents,
    CompanyResponse,
    ComponentDetail,
    EntityStatus,
    PaginatedCompanyResponse,
    RiskLevel,
    SearchMeta,
)
from predator_common.models import Company, RiskScore

router = APIRouter(prefix="/companies", tags=["компанії"])

def determine_risk_level(score: float) -> RiskLevel:
    """Мапінг балу на 5-рівневу шкалу v55.2."""
    if score < 20:
        return RiskLevel.STABLE
    if score < 40:
        return RiskLevel.WATCHLIST
    if score < 60:
        return RiskLevel.ELEVATED
    if score < 80:
        return RiskLevel.HIGH_ALERT
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
    search: Annotated[str | None, Query(description="Пошук по назві або EDRPOU")] = None,
    risk_level: Annotated[RiskLevel | None, Query(description="Фільтр за рівнем ризику")] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 25,
    offset: Annotated[int, Query(ge=0)] = 0,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA]))
) -> PaginatedCompanyResponse:
    """Отримання пагінованого списку компаній з фільтрацією.
    Згідно з TZ v55.2 використовується UEID як основний ключ.
    """
    start_time = time.time()

    query = select(
        Company.ueid,
        Company.name,
        Company.edrpou,
        Company.status,
        Company.sector,
        Company.cers_score,
        Company.cers_confidence,
        Company.created_at,
        Company.updated_at,
    ).where(Company.tenant_id == tenant_id)

    if search:
        search_pattern = f"%{search}%"
        query = query.where(or_(
            Company.name.ilike(search_pattern),
            Company.edrpou.ilike(search_pattern)
        ))

    # Фільтрація за рівнем ризику потребує мапінгу меж балів
    if risk_level:
        if risk_level == RiskLevel.STABLE:
            query = query.where(Company.cers_score < 20)
        elif risk_level == RiskLevel.WATCHLIST:
            query = query.where(and_(Company.cers_score >= 20, Company.cers_score < 40))
        elif risk_level == RiskLevel.ELEVATED:
            query = query.where(and_(Company.cers_score >= 40, Company.cers_score < 60))
        elif risk_level == RiskLevel.HIGH_ALERT:
            query = query.where(and_(Company.cers_score >= 60, Company.cers_score < 80))
        elif risk_level == RiskLevel.CRITICAL:
            query = query.where(Company.cers_score >= 80)

    # Total count
    count_query = select(func.count()).select_from(query.subquery())
    total_res = await db.execute(count_query)
    total_count = total_res.scalar() or 0

    # Results
    query = query.order_by(Company.cers_score.desc()).offset(offset).limit(limit)
    result = await db.execute(query)
    companies = result.all()

    data = []
    for c in companies:
        level = determine_risk_level(c.cers_score)
        data.append(
            CompanyResponse(
                ueid=c.ueid,
                name=c.name,
                edrpou=c.edrpou,
                status=EntityStatus(c.status),
                sector=c.sector,
                risk_level=level,
                risk_score=c.cers_score,
                cers_confidence=c.cers_confidence,
                created_at=c.created_at,
                updated_at=c.updated_at,
            )
        )

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
    """Повне досьє компанії з 5-шаровим розбором ризику.
    """
    query = select(
        Company.ueid,
        Company.name,
        Company.edrpou,
        Company.status,
        Company.sector,
        Company.cers_score,
        Company.cers_confidence,
        Company.created_at,
        Company.updated_at,
    ).where(Company.ueid == ueid, Company.tenant_id == tenant_id)
    result = await db.execute(query)
    company_data = result.first()

    if not company_data:
        raise HTTPException(status_code=404, detail="Компанію не знайдено")

    # Отримуємо останній детальний RiskScore (5 шарів)
    score_query = select(
        RiskScore.behavioral_score,
        RiskScore.institutional_score,
        RiskScore.influence_score,
        RiskScore.structural_score,
        RiskScore.predictive_score,
    ).where(
        RiskScore.entity_ueid == ueid,
        RiskScore.tenant_id == tenant_id,
    ).order_by(RiskScore.score_date.desc()).limit(1)

    score_res = await db.execute(score_query)
    last_score_data = score_res.first()

    risk_details = None
    if last_score_data:
        risk_details = CersComponents(
            behavioral=ComponentDetail(value=last_score_data.behavioral_score or 0, weight=0.25),
            institutional=ComponentDetail(value=last_score_data.institutional_score or 0, weight=0.20),
            influence=ComponentDetail(value=last_score_data.influence_score or 0, weight=0.20),
            structural=ComponentDetail(value=last_score_data.structural_score or 0, weight=0.15),
            predictive=ComponentDetail(value=last_score_data.predictive_score or 0, weight=0.20),
        )

    level = determine_risk_level(company_data.cers_score)

    return CompanyResponse(
        ueid=company_data.ueid,
        name=company_data.name,
        edrpou=company_data.edrpou,
        status=EntityStatus(company_data.status),
        sector=company_data.sector,
        risk_level=level,
        risk_score=company_data.cers_score,
        cers_confidence=company_data.cers_confidence,
        risk_details=risk_details,
        interpretation=map_interpretation(level),
        created_at=company_data.created_at,
        updated_at=company_data.updated_at,
    )
