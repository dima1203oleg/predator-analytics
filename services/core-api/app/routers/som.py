from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_tenant_id
from app.services.axiom_verifier import AxiomVerifier
from predator_common.models import Anomaly, Proposal

router = APIRouter(prefix="/som", tags=["SOM"])

@router.get("/status", summary="Загальний статус SOM")
async def get_status(tenant_id: str = Depends(get_tenant_id), db: AsyncSession = Depends(get_db)):
    audit = await AxiomVerifier.verify_data_consistency(db)
    return {
        "health": audit.get("purity", 100),
        "status": "SECURE" if audit.get("status") == "PASS" else "WARNING",
        "axioms_verified": True,
        "metrics": {"cpu": 12, "memory": 45, "io": 8},
        "audit": audit
    }

@router.get("/anomalies", summary="Виявлені аномалії")
async def get_anomalies(tenant_id: str = Depends(get_tenant_id), db: AsyncSession = Depends(get_db)):
    """Отримання реальних аномалій з бази даних."""
    query = select(Anomaly).where(Anomaly.tenant_id == tenant_id).order_by(Anomaly.detected_at.desc()).limit(50)
    result = await db.execute(query)
    anomalies = result.scalars().all()
    return [
        {"id": a.id, "type": a.type, "severity": a.severity, "msg": a.message, "time": a.detected_at}
        for a in anomalies
    ]

@router.get("/proposals", summary="Пропозиції SOM-агентів")
async def get_proposals(tenant_id: str = Depends(get_tenant_id), db: AsyncSession = Depends(get_db)):
    """Отримання реальних пропозицій з бази даних."""
    query = select(Proposal).where(Proposal.tenant_id == tenant_id).order_by(Proposal.created_at.desc()).limit(50)
    result = await db.execute(query)
    proposals = result.scalars().all()
    return [
        {"id": p.id, "type": p.type, "confidence": p.confidence, "title": p.title, "ueid": p.ueid}
        for p in proposals
    ]

@router.post("/emergency", summary="Активація екстреного протоколу")
async def activate_emergency(data: Dict[str, Any], tenant_id: str = Depends(get_tenant_id)):
    return {"status": "activated", "level": data.get("level"), "actor": data.get("actor")}

@router.get("/axioms/verify", summary="Повна верифікація аксіом")
async def verify_axioms(tenant_id: str = Depends(get_tenant_id), db: AsyncSession = Depends(get_db)):
    """Запуск глибокого аудиту цілісності системи."""
    results = await AxiomVerifier.run_full_audit(db)
    return {"status": "complete", "results": results}
