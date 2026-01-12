from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List
from app.database import get_db
from libs.core.models import TrinityAuditLog
from pydantic import BaseModel
from datetime import datetime
import uuid

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

@router.get("/logs", response_model=List[TrinityLogSchema])
async def get_trinity_logs(
    limit: int = 20,
    db: AsyncSession = Depends(get_db)
):
    """
    Fetch recent audit logs from Trinity (Triple Agent).
    """
    try:
        query = select(TrinityAuditLog).order_by(desc(TrinityAuditLog.created_at)).limit(limit)
        result = await db.execute(query)
        logs = result.scalars().all()
        return logs
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/logs/{log_id}")
async def get_trinity_log_detail(
    log_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Fetch detailed reasoning chain for a specific Trinity operation.
    """
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
        "final_output": log.final_output
    }
