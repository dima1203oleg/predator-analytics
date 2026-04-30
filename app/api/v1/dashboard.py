"""📈 DASHBOARD — /api/v1/dashboard
Aggregated statistics and system overview for PREDATOR Analytics v4.2.0.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select

from app.core.database import get_db
from app.models.declaration import Declaration
from app.models.entities import Dataset, Job, Source

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/dashboard")

@router.get("/overview")
async def get_dashboard_overview(db: AsyncSession = Depends(get_db)):
    """Returns high-level overview metrics for the main dashboard.
    """
    try:
        # 1. Sources Stats
        total_sources_query = select(func.count(Source.id))
        active_sources_query = select(func.count(Source.id)).where(Source.is_active)

        # 2. Datasets Stats
        total_datasets_query = select(func.count(Dataset.id))
        datasets_by_status_query = select(Dataset.status, func.count(Dataset.id)).group_by(Dataset.status)

        # 3. Jobs Stats
        total_jobs_query = select(func.count(Job.id))
        jobs_by_status_query = select(Job.status, func.count(Job.id)).group_by(Job.status)

        # 4. Impact Stats (Declarations)
        total_decls_query = select(func.count(Declaration.id))
        total_value_query = select(func.sum(Declaration.value_usd))

        # Execute queries
        total_sources = (await db.execute(total_sources_query)).scalar() or 0
        active_sources = (await db.execute(active_sources_query)).scalar() or 0
        total_datasets = (await db.execute(total_datasets_query)).scalar() or 0
        total_jobs = (await db.execute(total_jobs_query)).scalar() or 0
        total_decls = (await db.execute(total_decls_query)).scalar() or 0
        total_value = (await db.execute(total_value_query)).scalar() or 0.0

        # Status distributions
        datasets_statuses = (await db.execute(datasets_by_status_query)).all()
        jobs_statuses = (await db.execute(jobs_by_status_query)).all()

        # Recent datasets
        recent_datasets_query = select(Dataset).order_by(Dataset.created_at.desc()).limit(5)
        recent_datasets = (await db.execute(recent_datasets_query)).scalars().all()

        return {
            "metrics": {
                "sources": {
                    "total": total_sources,
                    "active": active_sources
                },
                "datasets": {
                    "total": total_datasets,
                    "by_status": dict(datasets_statuses)
                },
                "jobs": {
                    "total": total_jobs,
                    "by_status": dict(jobs_statuses)
                },
                "impact": {
                    "total_declarations": total_decls,
                    "total_value_usd": float(total_value)
                }
            },
            "recent_activity": [
                {
                    "id": str(d.id),
                    "name": d.name,
                    "status": d.status,
                    "created_at": d.created_at.isoformat()
                } for d in recent_datasets
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dashboard aggregation failed: {e!s}")
