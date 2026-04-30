from __future__ import annotations

from typing import TYPE_CHECKING

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import desc, select

from app.database import get_db
from app.libs.core.models import TrinityAuditLog

if TYPE_CHECKING:
    from datetime import datetime
    import uuid

    from sqlalchemy.ext.asyncio import AsyncSession


router = APIRouter()


class TrinityLogSchema(BaseModel):
    id: uuid.UUID
    request_text: str
    user_id: str
    intent: str
    status: str
    risk_level: str
    execution_time_ms: int
    created_at: datetime

    class Config:
        from_attributes = True


@router.get("/logs", response_model=list[TrinityLogSchema])
async def get_trinity_logs(limit: int = 20, db: AsyncSession = Depends(get_db)):
    """Fetch recent audit logs from Trinity (Triple Agent)."""
    try:
        query = select(TrinityAuditLog).order_by(desc(TrinityAuditLog.created_at)).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/logs/{log_id}")
async def get_trinity_log_detail(log_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Fetch detailed reasoning chain for a specific Trinity operation."""
    query = select(TrinityAuditLog).where(TrinityAuditLog.id == log_id)
    result = await db.execute(query)
    log = result.scalars().first()

    if not log:
        raise HTTPException(status_code=404, detail="Log not found")

    return {
        "id": log.id,
        "plan": log.gemini_plan,
        "mistral_output": log.mistral_output,
        "audit": log.copilot_audit,
        "final_output": log.final_output,
    }
