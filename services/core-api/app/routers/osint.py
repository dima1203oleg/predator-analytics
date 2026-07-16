from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException
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


@router.get("/search", summary="Пошук компаній (OSINT)")
async def search_companies(
    q: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    tenant_id: Annotated[str, Depends(get_tenant_id)]
) -> list[dict[str, Any]]:
    # Search by EDRPOU or Name (case insensitive)
    query = select(Company, RiskScore).outerjoin(
        RiskScore, (Company.ueid == RiskScore.entity_ueid) & (RiskScore.tenant_id == tenant_id)
    ).where(
        Company.tenant_id == tenant_id,
        (Company.edrpou.ilike(f"%{q}%")) | (Company.name.ilike(f"%{q}%"))
    ).limit(20)

    result = await db.execute(query)
    rows = result.all()

    response = []
    for company, risk in rows:
        response.append({
            "ueid": company.ueid,
            "edrpou": company.edrpou,
            "name": company.name,
            "status": company.status,
            "industry": company.industry,
            "risk_score": risk.cers if risk else company.cers_score
        })
    return response

@router.get("/company/{ueid}", summary="Досьє компанії")
async def get_company_dossier(
    ueid: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    tenant_id: Annotated[str, Depends(get_tenant_id)]
) -> dict[str, Any]:
    company = await db.scalar(select(Company).where(Company.tenant_id == tenant_id, Company.ueid == ueid))
    if not company:
        raise HTTPException(status_code=404, detail="Компанію не знайдено")

    risk = await db.scalar(select(RiskScore).where(RiskScore.tenant_id == tenant_id, RiskScore.entity_ueid == ueid))
    anomalies_result = await db.execute(select(Anomaly).where(Anomaly.tenant_id == tenant_id, Anomaly.entity_ueid == ueid).order_by(Anomaly.detected_at.desc()))
    anomalies = anomalies_result.scalars().all()

    return {
        "company": {
            "ueid": company.ueid,
            "edrpou": company.edrpou,
            "name": company.name,
            "legal_form": company.legal_form,
            "status": company.status,
            "registration_date": company.registration_date.isoformat() if company.registration_date else None,
            "address": company.address,
            "industry": company.industry,
            "sector": company.sector
        },
        "risk_profile": {
            "cers": risk.cers if risk else company.cers_score,
            "behavioral": risk.behavioral_score if risk else None,
            "institutional": risk.institutional_score if risk else None,
            "structural": risk.structural_score if risk else None,
            "flags": risk.flags if risk else []
        },
        "anomalies": [
            {
                "type": a.type,
                "severity": a.severity,
                "message": a.message,
                "detected_at": a.detected_at.isoformat() if a.detected_at else None
            } for a in anomalies
        ]
    }

@router.get("/analytics/network-density", summary="Щільність зв'язків (Graph Analytics)")
async def get_network_density(
    ueid: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    tenant_id: Annotated[str, Depends(get_tenant_id)]
) -> dict[str, Any]:
    """Аналіз графа зв'язків навколо компанії."""
    # Симуляція графової аналітики (в реальності тут був би запит до Neo4j)
    return {
        "entity_ueid": ueid,
        "density_score": 85,
        "nodes_analyzed": 142,
        "edges_analyzed": 415,
        "risk_level": "HIGH",
        "red_flags": [
            "Виявлено 3 циклічні зв'язки власності",
            "Спільний директор з 15 іншими компаніями",
            "Висока концентрація зв'язків першого рівня"
        ]
    }

@router.get("/analytics/sanctions-evasion", summary="Аналіз обходу санкцій")
async def get_sanctions_evasion_risk(
    ueid: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    tenant_id: Annotated[str, Depends(get_tenant_id)]
) -> dict[str, Any]:
    """Аналіз патернів обходу санкцій."""
    # Симуляція аналізу
    return {
        "entity_ueid": ueid,
        "evasion_risk_score": 92,
        "sanctions_proximity": 2,  # hops
        "indicators": [
            "Зміна кінцевого бенефіціара за тиждень до введення санкцій",
            "Зв'язок 2-го рівня з підсанкційною особою (РНБО)",
            "Транзакції в юрисдикції високого ризику (Кіпр)"
        ]
    }
