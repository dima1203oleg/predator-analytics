from typing import Annotated, Any

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_tenant_id
from app.services.ukraine_registries import UkraineRegistriesService
from predator_common.models import Anomaly, Company, RiskScore

router = APIRouter(prefix="/osint", tags=["OSINT"])

@router.get("/registries", summary="Статус підключення до реєстрів (для UI)")
async def get_osint_registries(
    service: Annotated[UkraineRegistriesService, Depends()],
    tenant_id: Annotated[str, Depends(get_tenant_id)],
) -> dict[str, Any]:
    """Повертає статус усіх підключених реєстрів у форматі, який очікує UI."""
    return await service.get_registries_status()

@router.get("/tools", summary="Доступні OSINT інструменти")
async def get_osint_tools(tenant_id: Annotated[str, Depends(get_tenant_id)]) -> list[dict[str, str]]:
    return [
        {"id": "datagov", "name": "Data.gov.ua", "status": "active", "type": "white"},
        {"id": "prozorro", "name": "Prozorro API", "status": "active", "type": "white"},
        {"id": "youcontrol", "name": "YouControl", "status": "active", "type": "white"},
        {"id": "marine", "name": "MarineTraffic", "status": "warning", "type": "white"},
        {"id": "darknet", "name": "Darknet Scraper", "status": "offline", "type": "dark"}
    ]

@router.get("/stats", summary="OSINT статистика")
async def get_osint_stats(
    db: Annotated[AsyncSession, Depends(get_db)],
    tenant_id: Annotated[str, Depends(get_tenant_id)]
) -> dict[str, int]:
    total_companies = await db.scalar(select(func.count()).select_from(Company).where(Company.tenant_id == tenant_id)) or 0
    high_risk = await db.scalar(select(func.count()).select_from(RiskScore).where(RiskScore.tenant_id == tenant_id, RiskScore.cers >= 70)) or 0
    return {
        "total_records": total_companies,
        "high_risk_found": high_risk,
        "sources_scanned": 5,
        "active_monitors": 12
    }

@router.get("/feed", summary="Живий фід OSINT знахідок")
async def get_osint_feed(
    db: Annotated[AsyncSession, Depends(get_db)],
    tenant_id: Annotated[str, Depends(get_tenant_id)]
) -> list[dict[str, Any]]:
    anomalies = await db.execute(select(Anomaly).where(Anomaly.tenant_id == tenant_id).order_by(Anomaly.detected_at.desc()).limit(15))
    results = []
    for a in anomalies.scalars().all():
        results.append({
            "id": str(a.id),
            "timestamp": a.detected_at.isoformat() if a.detected_at else None,
            "title": a.message or "Аномалія",
            "severity": a.severity or "medium",
            "source": a.type or "System",
            "entity_ueid": a.entity_ueid
        })
    return results
