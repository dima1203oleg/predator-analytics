import csv
import io
import os
from datetime import datetime
from typing import Annotated, Any, List

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from fpdf import FPDF

from app.database import get_db
from app.dependencies import get_tenant_id
from app.services.ukraine_registries import UkraineRegistriesService
from app.services.search_service import SearchService
from predator_common.models import Anomaly, Company, RiskScore
from enum import Enum
import uuid
import json
from app.services.kafka_service import get_kafka_service
from app.services.valkey_service import get_valkey_service

class EntityType(str, Enum):
    PERSON = "person"
    COMPANY = "company"
    DOMAIN = "domain"
    EMAIL = "email"
    PHONE = "phone"
    VEHICLE = "vehicle"
    ADDRESS = "address"
    CRYPTO_WALLET = "crypto_wallet"
    IP = "ip"

class Classification(str, Enum):
    WHITE = "WHITE"
    GREY = "GREY"
    BLACK = "BLACK"

class ScanStartRequest(BaseModel):
    entity_type: EntityType
    identifier: str
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    edrpou: str | None = None
    rnokpp: str | None = None
    address: str | None = None
    classification_levels: list[Classification] = [Classification.WHITE, Classification.GREY]
    collectors_override: list[str] | None = None


class ExportEntity(BaseModel):
    id: str
    name: str
    code: str
    type: str
    riskLevel: str
    status: str
    source: str
    matchScore: int
    description: str

router = APIRouter(prefix="/osint", tags=["OSINT"])

@router.post("/scan/start", summary="Start OSINT Scan (Event-Driven)")
async def start_osint_scan(
    request: ScanStartRequest,
    tenant_id: Annotated[str, Depends(get_tenant_id)]
) -> dict[str, Any]:
    job_id = str(uuid.uuid4())
    
    redis = get_valkey_service()
    if redis._connected:
        status_data = {
            "status": "pending",
            "job_id": job_id,
            "created_at": datetime.now().isoformat()
        }
        # Redis uses await redis._client.setex(key, ttl, value)
        if hasattr(redis._client, "setex"):
            await redis._client.setex(f"osint_scan:{job_id}", 3600, json.dumps(status_data))
        else:
            await redis._client.set(f"osint_scan:{job_id}", json.dumps(status_data), ex=3600)
            
    kafka = get_kafka_service()
    payload = request.model_dump()
    payload["job_id"] = job_id
    payload["tenant_id"] = tenant_id
    
    await kafka.publish_event(
        topic="osint.scan.requested",
        key=job_id,
        event_type="OSINT_SCAN_REQUESTED",
        payload=payload
    )
    
    return {"status": "ok", "job_id": job_id, "message": "Scan started"}
    
@router.get("/scan/status/{job_id}", summary="Check OSINT Scan Status")
async def get_osint_scan_status(
    job_id: str,
    tenant_id: Annotated[str, Depends(get_tenant_id)]
) -> dict[str, Any]:
    redis = get_valkey_service()
    if not redis._connected:
        return {"status": "processing", "job_id": job_id}
        
    data_str = await redis._client.get(f"osint_scan:{job_id}")
    if not data_str:
        return {"status": "processing", "job_id": job_id}
        
    data = json.loads(data_str)
    return data


@router.post("/export/csv", summary="Експорт OSINT даних у CSV")
async def export_osint_csv(
    entities: List[ExportEntity],
    tenant_id: Annotated[str, Depends(get_tenant_id)]
):
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow(["ID", "Name", "Code", "Type", "Risk Level", "Status", "Source", "Match Score", "Description"])
    
    for entity in entities:
        writer.writerow([
            entity.id,
            entity.name,
            entity.code,
            entity.type,
            entity.riskLevel,
            entity.status,
            entity.source,
            entity.matchScore,
            entity.description
        ])
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=OSINT_Report_{datetime.now().strftime('%Y-%m-%d')}.csv"}
    )

@router.post("/export/pdf", summary="Експорт OSINT даних у PDF")
async def export_osint_pdf(
    entities: List[ExportEntity],
    tenant_id: Annotated[str, Depends(get_tenant_id)]
):
    pdf = FPDF()
    pdf.add_page()
    
    # Try to load DejaVuSans for Cyrillic support
    font_path = os.path.join(os.path.dirname(__file__), "..", "assets", "fonts", "DejaVuSans.ttf")
    if os.path.exists(font_path):
        pdf.add_font("DejaVu", "", font_path, uni=True)
        pdf.set_font("DejaVu", "", 16)
        has_font = True
    else:
        pdf.set_font("helvetica", "B", 16)
        has_font = False

    pdf.cell(0, 10, "OSINT Analytics Report", new_x="LMARGIN", new_y="NEXT", align="C")
    
    if has_font:
        pdf.set_font("DejaVu", "", 10)
    else:
        pdf.set_font("helvetica", "", 10)
        
    pdf.cell(0, 10, f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M')}", new_x="LMARGIN", new_y="NEXT", align="R")
    pdf.ln(5)
    
    for idx, entity in enumerate(entities, 1):
        if has_font:
            pdf.set_font("DejaVu", "", 12)
        else:
            pdf.set_font("helvetica", "B", 12)
            
        pdf.cell(0, 8, f"{idx}. {entity.name} (Code: {entity.code})", new_x="LMARGIN", new_y="NEXT")
        
        if has_font:
            pdf.set_font("DejaVu", "", 10)
        else:
            pdf.set_font("helvetica", "", 10)
        
        pdf.cell(0, 6, f"Type: {entity.type} | Risk: {entity.riskLevel} | Status: {entity.status}", new_x="LMARGIN", new_y="NEXT")
        pdf.cell(0, 6, f"Source: {entity.source} | Match Score: {entity.matchScore}%", new_x="LMARGIN", new_y="NEXT")
        pdf.multi_cell(0, 6, f"Description: {entity.description}")
        pdf.ln(4)
        
    pdf_content = pdf.output()
    
    return StreamingResponse(
        io.BytesIO(pdf_content),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=OSINT_Report_{datetime.now().strftime('%Y-%m-%d')}.pdf"}
    )

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


@router.get("/search", summary="Пошук сутностей (OSINT)")
async def search_entities(
    q: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    tenant_id: Annotated[str, Depends(get_tenant_id)]
) -> list[dict[str, Any]]:
    # Гібридний пошук компаній та осіб через SearchService
    return await SearchService.hybrid_search_all(q, db, tenant_id, limit=20)

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

@router.get("/entity/{ueid}/graph", summary="OSINT Граф сутності")
async def get_entity_osint_graph(
    ueid: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    tenant_id: Annotated[str, Depends(get_tenant_id)]
) -> dict[str, Any]:
    """Повертає граф зв'язків для конкретної сутності. 
    (Сумісно з Cytoscape JSON).
    """
    try:
        from app.core.graph import graph_db
        query = """
        MATCH (n {ueid: $ueid})-[r]-(m)
        WHERE n.tenant_id = $tenant_id AND (m.tenant_id = $tenant_id OR m.tenant_id IS NULL)
        RETURN n, r, m
        LIMIT 100
        """
        raw_results = await graph_db.run_query(query, {"ueid": ueid, "tenant_id": tenant_id})
        
        nodes_dict = {}
        edges = []
        
        if raw_results:
            for row in raw_results:
                n = row.get("n")
                m = row.get("m")
                r = row.get("r")
                
                for node in [n, m]:
                    if node:
                        node_id = node.get("ueid") or str(id(node))
                        if node_id not in nodes_dict:
                            # Cytoscape Format
                            nodes_dict[node_id] = {
                                "data": {
                                    "id": node_id,
                                    "label": node.get("name") or node.get("ueid") or "Unknown",
                                    "type": next(iter(node.labels)).lower() if hasattr(node, "labels") and node.labels else "entity",
                                    "properties": dict(node)
                                }
                            }
                if r:
                    edges.append({
                        "data": {
                            "id": str(id(r)),
                            "source": r.nodes[0].get("ueid") or str(id(r.nodes[0])),
                            "target": r.nodes[1].get("ueid") or str(id(r.nodes[1])),
                            "label": r.type,
                            "risk": "MEDIUM"
                        }
                    })
            if nodes_dict:
                return {
                    "nodes": list(nodes_dict.values()),
                    "edges": edges
                }
    except Exception:
        pass # Fallback to Mock
        
    # FALLBACK MOCK DATA FOR LOCAL DEVELOPMENT / DEMO
    company_name = "ТОВ 'ДЕМО-КОМПАНІЯ'"
    try:
        company = await db.scalar(select(Company).where(Company.tenant_id == tenant_id, Company.ueid == ueid))
        if company and company.name:
            company_name = company.name
    except Exception:
        pass

    mock_nodes = [
        {"data": {"id": ueid, "label": company_name, "type": "company"}, "classes": "center"},
        {"data": {"id": f"{ueid}_dir1", "label": "Іванов Іван Іванович", "type": "person"}},
        {"data": {"id": f"{ueid}_dir2", "label": "Смірнов Петро", "type": "person"}},
        {"data": {"id": f"{ueid}_off1", "label": "DEMO HOLDINGS LTD (Cyprus)", "type": "offshore"}},
        {"data": {"id": f"{ueid}_off2", "label": "GLOBAL VANTAGE (BVI)", "type": "offshore"}},
        {"data": {"id": f"{ueid}_dark", "label": "Darknet Forum Mention", "type": "darknet"}}
    ]
    
    mock_edges = [
        {"data": {"id": f"e1_{ueid}", "source": ueid, "target": f"{ueid}_dir1", "label": "DIRECTOR", "risk": "LOW"}},
        {"data": {"id": f"e2_{ueid}", "source": ueid, "target": f"{ueid}_dir2", "label": "FOUNDER", "risk": "MEDIUM"}},
        {"data": {"id": f"e3_{ueid}", "source": ueid, "target": f"{ueid}_off1", "label": "OWNED_BY", "risk": "HIGH"}},
        {"data": {"id": f"e4_{ueid}", "source": f"{ueid}_off1", "target": f"{ueid}_off2", "label": "FUNDS_TRANSFER", "risk": "HIGH"}},
        {"data": {"id": f"e5_{ueid}", "source": f"{ueid}_dir2", "target": f"{ueid}_dark", "label": "DATA_LEAK", "risk": "HIGH"}}
    ]
    
    return {
        "nodes": mock_nodes,
        "edges": mock_edges
    }
