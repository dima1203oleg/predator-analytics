"""Intelligence & Sovereign Advisors — PREDATOR Analytics v55.2-SM-EXTENDED.
Trinity Insight Engine: Генерація аналітичних висновків та інтерпретація ризиків.
"""
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import Permission
from app.database import get_db
from app.dependencies import PermissionChecker, get_tenant_id
from app.routers.companies import get_company
from app.routers.graph import get_beneficiaries, get_shadow_map
from app.services.ai_service import AIService
from predator_common.models import Anomaly, Company, RiskScore

router = APIRouter(prefix="/intelligence", tags=["інтелект"])

@router.get("/report/{ueid}", summary="Експертний висновок (Sovereign Advisor)")
async def generate_entity_report(
    ueid: str,
    tenant_id: str = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
    _ = Depends(PermissionChecker([Permission.READ_INTEL]))
):
    """Генерує глибокий аналітичний звіт для сутності.
    Інтегрує дані про компанію, 5-шаровий скоринг та графові зв'язки.
    """
    # 1. Збір даних
    try:
        company_data = await get_company(ueid, tenant_id, db)
        shadow_links = await get_shadow_map(ueid, 2, tenant_id)
        ubo_data = await get_beneficiaries(ueid, tenant_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Дані для аналізу неповні: {e!s}") from e

    # 2. Формування контексту для LLM
    context = {
        "company": company_data,
        "shadow_network": shadow_links,
        "beneficiaries": ubo_data,
        "v55_spec": "SM-EXTENDED"
    }

    prompt = f"""
    Проведи глибокий аналіз компанії {company_data.get('name')} (UEID: {ueid}).
    Дані скорингу CERS: {company_data.get('risk_details')}
    Тіньові зв'язки: {shadow_links}
    Кінцеві бенефіціари: {ubo_data}

    Твоє завдання:
    1. Надати критичну оцінку ризиків українською мовою.
    2. Пояснити 5 шарів ризику (Behavioral, Institutional, Influence, Structural, Predictive).
    3. Виявити можливі схеми ухилення або прихованого контролю.

    Відповідь повинна бути професійною, структурованою (Markdown) та містити конкретні рекомендації для аналітика.
    """

    # 3. Виклик Sovereign Advisor
    report = await AIService.generate_insight(prompt, context)

    return {
        "ueid": ueid,
        "status": "ready",
        "generated_at": datetime.now(UTC).isoformat(),
        "report": report
    }

@router.post("/analyze/cluster", summary="Аналіз картельного кластера")
async def analyze_cartel_cluster(
    cluster_id: str,
    entities: list[str],
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.RUN_GRAPH]))
):
    """Аналізує виявлений кластер на предмет тендерних змов (Bid Rigging)."""
    prompt = f"Проаналізуй кластер {cluster_id}, що складається з компаній: {', '.join(entities)}. Чи є ознаки карусельних торгів?"
    insight = await AIService.generate_insight(prompt, {"cluster": entities})
    return {"cluster_id": cluster_id, "insight": insight}

@router.get("/morning-brief", summary="Ранковий брифінг (Daily Pulse)")
async def get_morning_briefing(
    tenant_id: str = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """Генерує щоденний аналітичний підсумок системи (v55.2)."""
    from app.services.axiom_verifier import AxiomVerifier

    audit = await AxiomVerifier.verify_data_consistency(db)

    risks_count = await db.scalar(
        select(func.count()).select_from(RiskScore).where(RiskScore.cers >= 80)
    ) or 0
    entities_count = await db.scalar(select(func.count()).select_from(Company)) or 0
    anomalies_count = await db.scalar(select(func.count()).select_from(Anomaly)) or 0

    stats = {
        "risks_detected": risks_count,
        "new_entities": entities_count,
        "anomalies": anomalies_count,
        "system_health": audit.get("purity", 100),
    }

    prompt = "Згенеруй короткий аналітичний підсумок дня для PREDATOR v55.2. Використовуй українську мову."
    report = await AIService.generate_insight(prompt, stats)

    today = datetime.now(UTC).strftime("%Y-%m-%d")
    return {
        "ueid": f"daily-brief-{today}",
        "title": "Sovereign Daily Brief",
        "report": report,
        "engine": "Trinity SM-EXTENDED v55",
        "metrics": stats
    }


@router.get("/ma-targets", summary="Сканер M&A цілей")
async def get_ma_targets(
    limit: int = 20,
    tenant_id: str = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
    _ = Depends(PermissionChecker([Permission.READ_INTEL]))
):
    """Повертає список компаній-цілей для M&A (стресові активи або стратегічні цілі)."""
    # HR-07: Тільки конкретні колонки
    stmt = (
        select(
            Company.ueid,
            Company.name,
            Company.industry,
            Company.cers_score,
            Company.status
        )
        .where(Company.tenant_id == tenant_id)
        .where(Company.cers_score >= 60)
        .order_by(Company.cers_score.desc())
        .limit(limit)
    )

    result = await db.execute(stmt)
    targets = result.all()

    return [
        {
            "ueid": r.ueid,
            "name": r.name,
            "industry": r.industry,
            "risk_score": r.cers_score or 0,
            "status": r.status,
            "opportunity_type": "Distressed Asset" if (r.cers_score or 0) > 85 else "Strategic Target"
        } for r in targets
    ]
