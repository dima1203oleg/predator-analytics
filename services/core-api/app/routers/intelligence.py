"""
Intelligence & Sovereign Advisors — PREDATOR Analytics v55.2-SM-EXTENDED.
Trinity Insight Engine: Генерація аналітичних висновків та інтерпретація ризиків.
"""
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from app.services.ai_service import AIService
from app.routers.companies import get_company
from app.routers.graph import get_shadow_map, get_beneficiaries
from app.dependencies import PermissionChecker, get_tenant_id
from app.core.permissions import Permission
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db

router = APIRouter(prefix="/intelligence", tags=["інтелект"])

@router.get("/report/{ueid}", summary="Експертний висновок (Sovereign Advisor)")
async def generate_entity_report(
    ueid: str,
    tenant_id: str = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
    _ = Depends(PermissionChecker([Permission.READ_INTEL]))
):
    """
    Генерує глибокий аналітичний звіт для сутності.
    Інтегрує дані про компанію, 5-шаровий скоринг та графові зв'язки.
    """
    # 1. Збір даних
    try:
        company_data = await get_company(ueid, tenant_id, db)
        shadow_links = await get_shadow_map(ueid, 2, tenant_id)
        ubo_data = await get_beneficiaries(ueid, tenant_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Дані для аналізу неповні: {str(e)}")

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
        "generated_at": "2026-03-10T06:45:00Z",
        "report": report
    }

@router.post("/analyze/cluster", summary="Аналіз картельного кластера")
async def analyze_cartel_cluster(
    cluster_id: str,
    entities: List[str],
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.RUN_GRAPH]))
):
    """
    Аналізує виявлений кластер на предмет тендерних змов (Bid Rigging).
    """
    prompt = f"Проаналізуй кластер {cluster_id}, що складається з компаній: {', '.join(entities)}. Чи є ознаки карусельних торгів?"
    insight = await AIService.generate_insight(prompt, {"cluster": entities})
    return {"cluster_id": cluster_id, "insight": insight}
