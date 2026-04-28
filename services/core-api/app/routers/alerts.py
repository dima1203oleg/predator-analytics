"""Alerts Router — PREDATOR Analytics v61.0-ELITE.

Ендпоінти для роботи з алертами та сповіщеннями.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import Permission
from app.database import get_db
from app.dependencies import PermissionChecker, get_tenant_id
from predator_common.models import Alert

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("")
async def get_alerts(
    tenant_id: str = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
    persona: str = Query(default="ALL"),
    limit: int = Query(default=50, le=100),
    _ = Depends(PermissionChecker([Permission.READ_INTEL])),
):
    """Отримання алертів з бази даних."""
    query = (
        select(Alert)
        .where(Alert.tenant_id == tenant_id)
        .order_by(Alert.created_at.desc())
        .limit(limit)
    )
    result = await db.execute(query)
    alerts = result.scalars().all()

    return [
        {
            "id": str(a.id),
            "title": a.title,
            "description": a.message,
            "severity": a.severity,
            "category": a.alert_type,
            "persona": "ALL",
            "timestamp": a.created_at.isoformat() if a.created_at else None,
            "source": a.entity_type or "system",
            "is_read": a.is_read,
            "is_pinned": False,
            "metadata": a.metadata_ or {},
        }
        for a in alerts
    ]
