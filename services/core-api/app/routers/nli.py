"""NLI Router — PREDATOR Analytics v61.0-ELITE.

API для Natural Language Investigation (Фаза 5).
"""
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.permissions import Permission
from app.dependencies import PermissionChecker
from app.services.nli_service import NLIService

router = APIRouter(prefix="/nli", tags=["nli"])


class InvestigateRequest(BaseModel):
    query: str
    context: dict[str, Any] | None = None


@router.post("/investigate")
async def investigate_query(
    payload: InvestigateRequest,
    user: dict = Depends(PermissionChecker([Permission.READ_INTEL]))
):
    """
    Класифікація інтенту та маршрутизація запиту (Phase 5.1 & 5.2).
    Повертає класифікацію та наратив від AI.
    """
    try:
        result = await NLIService.process_investigation_query(payload.query, payload.context)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"NLI investigation failed: {e!s}") from e
