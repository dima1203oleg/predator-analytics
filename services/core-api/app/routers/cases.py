"""Cases Router — PREDATOR Analytics v55.1.

Ендпоінти для роботи з кейсами/справами.
"""
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import Permission
from app.database import get_db
from app.dependencies import PermissionChecker, get_tenant_id
from predator_common.models import RiskScore

router = APIRouter(prefix="/cases", tags=["cases"])


@router.get("")
async def get_cases(
    tenant_id: str = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
    status: str = Query(default=None),
    limit: int = Query(default=50, le=100),
    _ = Depends(PermissionChecker([Permission.READ_INTEL])),
):
    """Отримання кейсів на основі високоризикових сутностей."""
    query = (
        select(RiskScore)
        .where(RiskScore.tenant_id == tenant_id, RiskScore.cers >= 60)
        .order_by(RiskScore.score_date.desc())
        .limit(limit)
    )
    result = await db.execute(query)
    scores = result.scalars().all()

    cases = []
    for s in scores:
        risk = int(s.cers) if s.cers else 0
        case_status = (
            "КРИТИЧНО" if risk >= 85 else
            "В РОБОТІ" if risk >= 70 else
            "ВІДКРИТО"
        )
        priority = (
            "critical" if risk >= 85 else
            "high" if risk >= 70 else
            "medium"
        )

        cases.append({
            "id": str(s.id),
            "title": f"Ризик-кейс: {s.entity_ueid[:20]}",
            "situation": s.explanation.get("summary", "Виявлено підвищений ризик") if s.explanation else "Виявлено підвищений ризик",
            "status": case_status,
            "priority": priority,
            "risk_score": risk,
            "sector": s.entity_type or "company",
            "created_at": s.score_date.isoformat() if s.score_date else datetime.now(UTC).isoformat(),
            "updated_at": s.calculated_at.isoformat() if s.calculated_at else datetime.now(UTC).isoformat(),
            "ai_insight": s.explanation.get("ai_insight") if s.explanation else None,
            "entity_id": s.entity_ueid,
        })

    return cases
