"""API Endpoints для історичних даних митних декларацій.

Endpoints для доступу до історичних даних за 5-8 років.
"""

from __future__ import annotations

import logging
from datetime import date, datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_db
from app.models import Declaration

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/historical", tags=["Historical Declarations"])


@router.get("/declarations")
async def get_historical_declarations(
    start_date: date = Query(..., description="Початкова дата"),
    end_date: date = Query(..., description="Кінцева дата"),
    importer_ueid: str | None = Query(None, description="UEID імпортера"),
    uktzed_code: str | None = Query(None, description="Код УКТЗЕД"),
    customs_post: str | None = Query(None, description="Код митного посту"),
    limit: int = Query(100, ge=1, le=10000, description="Ліміт результатів"),
    offset: int = Query(0, ge=0, description="Зміщення"),
    db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    """Отримати історичні декларації за період.
    
    Підтримує фільтрацію по імпортеру, УКТЗЕД коду та митному посту.
    """
    # Побудова запиту
    query = select(Declaration).where(
        Declaration.declaration_date >= start_date,
        Declaration.declaration_date <= end_date
    )
    
    # Додавання фільтрів
    if importer_ueid:
        query = query.where(Declaration.importer_ueid == importer_ueid)
    
    if uktzed_code:
        query = query.where(Declaration.uktzed_code == uktzed_code)
    
    if customs_post:
        query = query.where(Declaration.customs_post == customs_post)
    
    # Сортування та пагінація
    query = query.order_by(Declaration.declaration_date.desc())
    query = query.limit(limit).offset(offset)
    
    # Виконання запиту
    result = await db.execute(query)
    declarations = result.scalars().all()
    
    # Отримання загальної кількості
    count_query = select(func.count()).select_from(
        select(Declaration).where(
            Declaration.declaration_date >= start_date,
            Declaration.declaration_date <= end_date
        )
    )
    
    if importer_ueid:
        count_query = count_query.where(Declaration.importer_ueid == importer_ueid)
    if uktzed_code:
        count_query = count_query.where(Declaration.uktzed_code == uktzed_code)
    if customs_post:
        count_query = count_query.where(Declaration.customs_post == customs_post)
    
    count_result = await db.execute(count_query)
    total_count = count_result.scalar()
    
    return {
        "total": total_count,
        "limit": limit,
        "offset": offset,
        "data": [
            {
                "id": str(d.id),
                "declaration_number": d.declaration_number,
                "declaration_date": d.declaration_date.isoformat() if d.declaration_date else None,
                "customs_post": d.customs_post,
                "uktzed_code": d.uktzed_code,
                "goods_description": d.goods_description,
                "weight_kg": float(d.weight_kg) if d.weight_kg else None,
                "value_usd": float(d.value_usd) if d.value_usd else None,
                "origin_country": d.origin_country,
                "importer_ueid": d.importer_ueid,
                "status": d.status,
            }
            for d in declarations
        ]
    }


@router.get("/statistics/monthly")
async def get_monthly_statistics(
    start_date: date = Query(..., description="Початкова дата"),
    end_date: date = Query(..., description="Кінцева дата"),
    db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    """Отримати щомісячну статистику імпорту."""
    query = select(
        func.date_trunc('month', Declaration.declaration_date).label('month'),
        func.count(Declaration.id).label('total_declarations'),
        func.sum(Declaration.value_usd).label('total_value_usd'),
        func.sum(Declaration.weight_kg).label('total_weight_kg'),
        func.count(func.distinct(Declaration.importer_ueid)).label('unique_importers'),
        func.count(func.distinct(Declaration.uktzed_code)).label('unique_uktzed_codes'),
    ).where(
        Declaration.declaration_date >= start_date,
        Declaration.declaration_date <= end_date
    ).group_by(
        func.date_trunc('month', Declaration.declaration_date)
    ).order_by(
        func.date_trunc('month', Declaration.declaration_date)
    )
    
    result = await db.execute(query)
    stats = result.all()
    
    return {
        "data": [
            {
                "month": row.month.isoformat() if row.month else None,
                "total_declarations": row.total_declarations,
                "total_value_usd": float(row.total_value_usd) if row.total_value_usd else 0.0,
                "total_weight_kg": float(row.total_weight_kg) if row.total_weight_kg else 0.0,
                "unique_importers": row.unique_importers,
                "unique_uktzed_codes": row.unique_uktzed_codes,
            }
            for row in stats
        ]
    }


@router.get("/statistics/uktzed")
async def get_uktzed_statistics(
    start_date: date = Query(..., description="Початкова дата"),
    end_date: date = Query(..., description="Кінцева дата"),
    uktzed_code: str | None = Query(None, description="Код УКТЗЕД"),
    limit: int = Query(100, ge=1, le=1000, description="Ліміт результатів"),
    db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    """Отримати статистику по УКТЗЕД кодах."""
    query = select(
        Declaration.uktzed_code,
        func.count(Declaration.id).label('total_declarations'),
        func.sum(Declaration.value_usd).label('total_value_usd'),
        func.avg(Declaration.value_usd).label('avg_value_usd'),
        func.sum(Declaration.weight_kg).label('total_weight_kg'),
    ).where(
        Declaration.declaration_date >= start_date,
        Declaration.declaration_date <= end_date
    )
    
    if uktzed_code:
        query = query.where(Declaration.uktzed_code == uktzed_code)
    
    query = query.group_by(Declaration.uktzed_code)
    query = query.order_by(func.sum(Declaration.value_usd).desc())
    query = query.limit(limit)
    
    result = await db.execute(query)
    stats = result.all()
    
    return {
        "data": [
            {
                "uktzed_code": row.uktzed_code,
                "total_declarations": row.total_declarations,
                "total_value_usd": float(row.total_value_usd) if row.total_value_usd else 0.0,
                "avg_value_usd": float(row.avg_value_usd) if row.avg_value_usd else 0.0,
                "total_weight_kg": float(row.total_weight_kg) if row.total_weight_kg else 0.0,
            }
            for row in stats
        ]
    }


@router.get("/statistics/importers")
async def get_importer_statistics(
    start_date: date = Query(..., description="Початкова дата"),
    end_date: date = Query(..., description="Кінцева дата"),
    importer_ueid: str | None = Query(None, description="UEID імпортера"),
    limit: int = Query(100, ge=1, le=1000, description="Ліміт результатів"),
    db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    """Отримати статистику по імпортерах."""
    query = select(
        Declaration.importer_ueid,
        func.count(Declaration.id).label('total_declarations'),
        func.sum(Declaration.value_usd).label('total_value_usd'),
        func.sum(Declaration.weight_kg).label('total_weight_kg'),
        func.count(func.distinct(Declaration.uktzed_code)).label('unique_uktzed_codes'),
    ).where(
        Declaration.declaration_date >= start_date,
        Declaration.declaration_date <= end_date
    )
    
    if importer_ueid:
        query = query.where(Declaration.importer_ueid == importer_ueid)
    
    query = query.group_by(Declaration.importer_ueid)
    query = query.order_by(func.sum(Declaration.value_usd).desc())
    query = query.limit(limit)
    
    result = await db.execute(query)
    stats = result.all()
    
    return {
        "data": [
            {
                "importer_ueid": row.importer_ueid,
                "total_declarations": row.total_declarations,
                "total_value_usd": float(row.total_value_usd) if row.total_value_usd else 0.0,
                "total_weight_kg": float(row.total_weight_kg) if row.total_weight_kg else 0.0,
                "unique_uktzed_codes": row.unique_uktzed_codes,
            }
            for row in stats
        ]
    }


@router.get("/statistics/customs-posts")
async def get_customs_post_statistics(
    start_date: date = Query(..., description="Початкова дата"),
    end_date: date = Query(..., description="Кінцева дата"),
    customs_post: str | None = Query(None, description="Код митного посту"),
    limit: int = Query(100, ge=1, le=1000, description="Ліміт результатів"),
    db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    """Отримати статистику по митних постах."""
    query = select(
        Declaration.customs_post,
        func.count(Declaration.id).label('total_declarations'),
        func.sum(Declaration.value_usd).label('total_value_usd'),
        func.sum(Declaration.weight_kg).label('total_weight_kg'),
        func.count(func.distinct(Declaration.importer_ueid)).label('unique_importers'),
    ).where(
        Declaration.declaration_date >= start_date,
        Declaration.declaration_date <= end_date
    )
    
    if customs_post:
        query = query.where(Declaration.customs_post == customs_post)
    
    query = query.group_by(Declaration.customs_post)
    query = query.order_by(func.sum(Declaration.value_usd).desc())
    query = query.limit(limit)
    
    result = await db.execute(query)
    stats = result.all()
    
    return {
        "data": [
            {
                "customs_post": row.customs_post,
                "total_declarations": row.total_declarations,
                "total_value_usd": float(row.total_value_usd) if row.total_value_usd else 0.0,
                "total_weight_kg": float(row.total_weight_kg) if row.total_weight_kg else 0.0,
                "unique_importers": row.unique_importers,
            }
            for row in stats
        ]
    }


@router.get("/trends")
async def get_trends(
    start_date: date = Query(..., description="Початкова дата"),
    end_date: date = Query(..., description="Кінцева дата"),
    uktzed_code: str | None = Query(None, description="Код УКТЗЕД"),
    importer_ueid: str | None = Query(None, description="UEID імпортера"),
    db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    """Отримати тренд імпорту за період."""
    query = select(
        func.date_trunc('month', Declaration.declaration_date).label('month'),
        func.sum(Declaration.value_usd).label('total_value_usd'),
        func.count(Declaration.id).label('total_declarations'),
    ).where(
        Declaration.declaration_date >= start_date,
        Declaration.declaration_date <= end_date
    )
    
    if uktzed_code:
        query = query.where(Declaration.uktzed_code == uktzed_code)
    
    if importer_ueid:
        query = query.where(Declaration.importer_ueid == importer_ueid)
    
    query = query.group_by(func.date_trunc('month', Declaration.declaration_date))
    query = query.order_by(func.date_trunc('month', Declaration.declaration_date))
    
    result = await db.execute(query)
    trends = result.all()
    
    # Розрахунок тренду
    if len(trends) >= 2:
        first_value = float(trends[0].total_value_usd) if trends[0].total_value_usd else 0.0
        last_value = float(trends[-1].total_value_usd) if trends[-1].total_value_usd else 0.0
        
        if first_value > 0:
            growth_rate = ((last_value - first_value) / first_value) * 100
        else:
            growth_rate = 0.0
    else:
        growth_rate = 0.0
    
    return {
        "growth_rate": growth_rate,
        "data": [
            {
                "month": row.month.isoformat() if row.month else None,
                "total_value_usd": float(row.total_value_usd) if row.total_value_usd else 0.0,
                "total_declarations": row.total_declarations,
            }
            for row in trends
        ]
    }


@router.get("/summary")
async def get_historical_summary(
    start_date: date = Query(..., description="Початкова дата"),
    end_date: date = Query(..., description="Кінцева дата"),
    db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    """Отримати підсумок історичних даних за період."""
    query = select(
        func.count(Declaration.id).label('total_declarations'),
        func.sum(Declaration.value_usd).label('total_value_usd'),
        func.sum(Declaration.weight_kg).label('total_weight_kg'),
        func.count(func.distinct(Declaration.importer_ueid)).label('unique_importers'),
        func.count(func.distinct(Declaration.uktzed_code)).label('unique_uktzed_codes'),
        func.count(func.distinct(Declaration.customs_post)).label('unique_customs_posts'),
        func.count(func.distinct(Declaration.origin_country)).label('unique_countries'),
    ).where(
        Declaration.declaration_date >= start_date,
        Declaration.declaration_date <= end_date
    )
    
    result = await db.execute(query)
    summary = result.one()
    
    return {
        "total_declarations": summary.total_declarations,
        "total_value_usd": float(summary.total_value_usd) if summary.total_value_usd else 0.0,
        "total_weight_kg": float(summary.total_weight_kg) if summary.total_weight_kg else 0.0,
        "unique_importers": summary.unique_importers,
        "unique_uktzed_codes": summary.unique_uktzed_codes,
        "unique_customs_posts": summary.unique_customs_posts,
        "unique_countries": summary.unique_countries,
    }
