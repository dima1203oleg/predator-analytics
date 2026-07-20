"""Compliance Router — PREDATOR Analytics v61.0-ELITE.

API для PREDATOR SHIELD (Фаза 6).
Доступ до Evidence Chain (Audit Logs) та Compliance Dashboard.
"""
from fastapi import APIRouter, Depends, HTTPException

from app.core.permissions import Permission
from app.dependencies import PermissionChecker, get_current_active_user
from app.services.evidence_service import EvidenceService

router = APIRouter(prefix="/compliance", tags=["compliance"])


@router.get("/audit")
async def get_audit_trail(
    limit: int = 50,
    user: dict = Depends(PermissionChecker([Permission.VIEW_SYSTEM_LOGS]))
):
    """
    Отримує незмінний ланцюг подій аудиту (Evidence Chain).
    """
    try:
        chain = await EvidenceService.get_chain(limit)
        return {"audit_trail": chain}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch audit trail: {e!s}") from e


@router.get("/stats")
async def get_compliance_stats(
    user: dict = Depends(get_current_active_user)
):
    """
    Отримує статистику для Compliance Dashboard.
    """
    try:
        stats = await EvidenceService.get_compliance_stats()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch compliance stats: {e!s}") from e


@router.post("/test-event")
async def create_test_event(
    action: str = "TEST_EVENT",
    entity_ueid: str = "TEST-123",
    user: dict = Depends(get_current_active_user)
):
    """
    Генерує тестову подію в Evidence Chain (для ручної перевірки).
    """
    user_id = user.get("sub", "unknown")
    event = await EvidenceService.record_event(
        action=action,
        user_id=user_id,
        entity_ueid=entity_ueid,
        details={"notes": "System generated test event"}
    )
    return event.to_dict()
