"""Risk Router — PREDATOR Analytics v55.2-SM-EXTENDED.

Оцінка ризиків та п'ятирівневих CERS індексів (Behavioral, Institutional, Influence, Structural, Predictive).
"""
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import Permission
from app.database import get_db
from app.dependencies import PermissionChecker, get_tenant_id

# --- Моделі відповідей v55.2 ---
from app.models.schemas import CersComponents, ComponentDetail, Uncertainty
from app.services.elite_risk_engine import EliteRiskEngine
from app.services.insight_engine import InsightEngine

# Використовуємо спільні моделі v55.2
from predator_common.models import Company, RiskScore

router = APIRouter(prefix="/risk", tags=["risk"])

# Сумісність зі старими збірками, де enum міг бути в singular-формі.
READ_COMPANIES_PERMISSION = getattr(
    Permission,
    "READ_COMPANIES",
    getattr(Permission, "READ_COMPANY", Permission.READ_CORP_DATA),
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
    key_drivers: list[KeyDriver]
    uncertainty: Uncertainty
    forecast_30d: float
    forecast_90d: float

class RiskScoreResponse(BaseModel):
    scores: list[EntityRiskScore]
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
    _ = Depends(PermissionChecker([READ_COMPANIES_PERMISSION]))
):
    """Отримати 5-рівневий CERS базис для компанії згідно v55.2-SM-EXTENDED.
    """
    start_time = datetime.now(UTC)

    ueids = [ueid.strip() for ueid in entities.split(",") if ueid.strip()]

    if not ueids:
        raise HTTPException(status_code=400, detail="Не вказано entities")

    # Звертаємося до бази для отримання компаній та їхніх останніх риск-скорів
    companies_query = select(
        Company.ueid,
        Company.name
    ).where(
        Company.tenant_id == tenant_id,
        Company.ueid.in_(ueids)
    )
    companies_result = await db.execute(companies_query)
    companies = {c.ueid: c for c in companies_result.all()}

    scores_query = select(
        RiskScore.entity_ueid,
        RiskScore.cers,
        RiskScore.cers_confidence,
        RiskScore.behavioral_score,
        RiskScore.institutional_score,
        RiskScore.influence_score,
        RiskScore.structural_score,
        RiskScore.predictive_score,
        RiskScore.explanation,
        RiskScore.flags
    ).where(
        RiskScore.tenant_id == tenant_id,
        RiskScore.entity_ueid.in_(ueids)
    ).order_by(RiskScore.entity_ueid, RiskScore.score_date.desc())

    # Спрощений вибір останнього скору для кожної компанії
    scores_result = await db.execute(scores_query)
    scores_list = scores_result.all()

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
            # Спроба динамічного обчислення (Elite Fallback)
            engine = EliteRiskEngine(db)
            try:
                await engine.compute_full_risk(ueid, tenant_id)
                # Отримуємо щойно створений запис
                scores_query_single = select(
                    RiskScore.entity_ueid,
                    RiskScore.cers,
                    RiskScore.cers_confidence,
                    RiskScore.behavioral_score,
                    RiskScore.institutional_score,
                    RiskScore.influence_score,
                    RiskScore.structural_score,
                    RiskScore.predictive_score,
                    RiskScore.explanation,
                    RiskScore.flags
                ).where(
                    RiskScore.tenant_id == tenant_id,
                    RiskScore.entity_ueid == ueid
                ).order_by(RiskScore.score_date.desc()).limit(1)

                score_res = await db.execute(scores_query_single)
                score_record = score_res.fetchone()
            except Exception as e:
                logger.error(f"Failed dynamic calculation for {ueid}: {e}")
                continue

        if not score_record:
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
            key_drivers=[
                KeyDriver(driver=k, contribution=v)
                for k, v in (score_record.explanation or {}).items()
            ] if score_record.explanation else [
                KeyDriver(driver=flag["name"], contribution=flag.get("weight", 0))
                for flag in (score_record.flags or [])
            ],
            uncertainty=Uncertainty(
                lower=max(0, score_record.cers - 5),
                upper=min(100, score_record.cers + 5)
            ),
            forecast_30d=score_record.predictive_score or score_record.cers,
            forecast_90d=(score_record.predictive_score or score_record.cers) * 1.05
        ))

    calc_time = int((datetime.now(UTC) - start_time).total_seconds() * 1000)

    return RiskScoreResponse(
        scores=response_scores,
        cached=True,
        calculation_time_ms=calc_time
    )


@router.get("/insight/{ueid}")
async def get_risk_insight(
    ueid: str,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([READ_COMPANIES_PERMISSION]))
):
    """Отримати інтелектуальний висновок AI для конкретної сутності."""
    # 1. Отримуємо дані компанії
    company_res = await db.execute(select(Company).where(Company.ueid == ueid, Company.tenant_id == tenant_id))
    company = company_res.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Компанію не знайдено")

    # 2. Обчислюємо/Отримуємо ризик через Elite Engine
    engine = EliteRiskEngine(db)
    risk_data = await engine.compute_full_risk(ueid, tenant_id)

    # 3. Генеруємо інсайт
    insight = await InsightEngine.generate_company_summary(
        company_data={"name": company.name, "edrpou": company.edrpou, "ueid": ueid},
        risk_data=risk_data,
        anomalies=[] # У реальності підтягнути з БД
    )

    return {
        "ueid": ueid,
        "insight": insight,
        "generated_at": datetime.now(UTC)
    }
