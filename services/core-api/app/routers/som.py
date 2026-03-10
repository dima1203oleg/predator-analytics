from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from app.dependencies import get_tenant_id
from app.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.axiom_verifier import AxiomVerifier

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
async def get_anomalies(tenant_id: str = Depends(get_tenant_id)):
    return [
        {"id": "A-01", "type": "DRIFT", "severity": "low", "msg": "Мінімальний дрифт у моделі RCE"},
        {"id": "A-02", "type": "SYNC", "severity": "medium", "msg": "Затримка синхронізації Truth Ledger"}
    ]

@router.get("/proposals", summary="Пропозиції SOM-агентів")
async def get_proposals(tenant_id: str = Depends(get_tenant_id)):
    return [
        {"id": "P-101", "type": "ARCH", "confidence": 0.94, "title": "Оптимізація семантичного пошуку", "ueid": "prop-101"},
        {"id": "P-102", "type": "SEC", "confidence": 0.88, "title": "Посилення шлюзів верифікації", "ueid": "prop-102"}
    ]

@router.post("/emergency", summary="Активація екстреного протоколу")
async def activate_emergency(data: Dict[str, Any], tenant_id: str = Depends(get_tenant_id)):
    return {"status": "activated", "level": data.get("level"), "actor": data.get("actor")}

@router.get("/axioms/verify", summary="Повна верифікація аксіом")
async def verify_axioms(tenant_id: str = Depends(get_tenant_id), db: AsyncSession = Depends(get_db)):
    """Запуск глибокого аудиту цілісності системи."""
    results = await AxiomVerifier.run_full_audit(db)
    return {"status": "complete", "results": results}
