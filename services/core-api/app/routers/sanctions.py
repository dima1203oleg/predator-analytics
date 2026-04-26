"""Sanctions Screening Router — PREDATOR Analytics v65.1-ELITE.

Забезпечує комплексний скринінг сутностей за національними та міжнародними санкційними списками.
"""
from datetime import UTC, datetime
from typing import Any, List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.core.permissions import Permission
from app.dependencies import PermissionChecker, get_tenant_id
from app.services.osint.global_sanctions import GlobalSanctionsService
from app.services.ukraine_registries import UkraineRegistriesService

router = APIRouter(prefix="/sanctions", tags=["санкції"])

class SanctionsScreenRequest(BaseModel):
    query: str = Field(..., description="Пошуковий запит (Назва або ПІБ)")
    entity_type: str = Field("organization", description="Тип сутності: organization або person")
    lists: List[str] = Field(default=["sdn", "eu", "uk", "rnbo"], description="Списки для перевірки")

class SanctionMatch(BaseModel):
    list_name: str
    reason: str
    confidence: float
    date_added: Optional[str] = None

class SanctionsScreenResponse(BaseModel):
    id: str
    query: str
    status: str  # 'clear', 'warning', 'blocked'
    matches: List[SanctionMatch]
    timestamp: str
    entity_type: str
    risk_score: float

@router.post("/screen", response_model=SanctionsScreenResponse, summary="Комплексний скринінг санкцій")
async def screen_entity(
    request: SanctionsScreenRequest,
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA]))
):
    """Виконує перевірку сутності за вказаними списками санкцій."""
    start_time = datetime.now(UTC)
    
    matches = []
    
    # 1. Перевірка через GlobalSanctionsService (International)
    global_service = GlobalSanctionsService()
    global_result = await global_service.check_entity(request.query, request.entity_type)
    
    for m in global_result.get("matches", []):
        matches.append(SanctionMatch(
            list_name=m["list"],
            reason=m["reason"],
            confidence=m["confidence"],
            date_added=None
        ))
        
    # 2. Перевірка через UkraineRegistriesService (RNBO)
    if "rnbo" in request.lists:
        ua_service = UkraineRegistriesService()
        try:
            # Для спрощення використовуємо пошук за назвою
            ua_result = await ua_service.check_sanctions(name=request.query)
            if ua_result.is_sanctioned:
                for m in ua_result.matches:
                    matches.append(SanctionMatch(
                        list_name=m.list_name,
                        reason=m.reason,
                        confidence=1.0,
                        date_added=m.date_added.isoformat() if m.date_added else None
                    ))
        finally:
            await ua_service.close()

    # 3. Визначення статусу та ризику
    risk_score = 0.0
    status = "clear"
    
    if matches:
        # Якщо є хоча б один збіг з впевненістю > 0.9 - блокуємо
        max_confidence = max(m.confidence for m in matches)
        risk_score = max_confidence * 100.0
        
        if max_confidence > 0.9:
            status = "blocked"
        else:
            status = "warning"

    return SanctionsScreenResponse(
        id=str(uuid.uuid4()),
        query=request.query,
        status=status,
        matches=matches,
        timestamp=datetime.now(UTC).isoformat(),
        entity_type=request.entity_type,
        risk_score=risk_score
    )
