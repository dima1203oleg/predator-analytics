"""🏢 COMPETITORS — /api/v1/competitors
Competitor Intelligence and Entity Analysis for PREDATOR Analytics v4.2.0.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc, func, select

from app.core.database import get_db
from app.models.declaration import Declaration

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/competitors")

@router.get("/active")
async def get_active_competitors(
    limit: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    """Повертає список найбільш активних компаній-імпортерів.
    """
    try:
        query = select(
            Declaration.company_name,
            func.count(Declaration.id).label('decl_count'),
            func.sum(Declaration.value_usd).label('total_value')
        ).group_by(Declaration.company_name).order_by(desc('total_value')).limit(limit)

        result = await db.execute(query)
        data = result.all()

        return {
            "competitors": [
                {
                    "name": row.company_name,
                    "activity_score": int(row.decl_count),
                    "total_value_usd": float(row.total_value or 0),
                    "status": "Active"
                } for row in data
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/search")
async def search_competitors(
    q: str = Query(..., min_length=2),
    db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    """Пошук конкретного конкурента за назвою.
    """
    try:
        query = select(
            Declaration.company_name,
            func.count(Declaration.id).label('count')
        ).where(Declaration.company_name.ilike(f"%{q}%")).group_by(Declaration.company_name).limit(20)

        result = await db.execute(query)
        data = result.all()

        return {
            "results": [
                {
                    "name": row.company_name,
                    "occurrences": row.count
                } for row in data
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
