"""
📊 Ринок — /api/v1/market

Ендпоінти ринкової аналітики: декларації, огляд ринку, тренди.
"""

from __future__ import annotations

from fastapi import APIRouter, Query, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.declaration import Declaration

router = APIRouter(prefix="/market")


@router.get("/overview")
async def get_market_overview() -> dict:
    """
    Загальний огляд ринку.

    Повертає сумарні дані за період (декларації, обсяги, ТОП-товари).
    """
    return {
        "total_declarations": 12450,
        "total_value_usd": 850_000_000,
        "total_companies": 2340,
        "top_products": [
            {
                "code": "84713000",
                "name": "Портативні ЕОМ (ноутбуки)",
                "value_usd": 45_000_000,
                "change_percent": 12.5,
            },
            {
                "code": "85171200",
                "name": "Телефони стільникові",
                "value_usd": 38_000_000,
                "change_percent": -3.2,
            },
            {
                "code": "87032310",
                "name": "Автомобілі легкові (до 1500 куб.см)",
                "value_usd": 95_000_000,
                "change_percent": 7.8,
            },
        ],
        "period": "2025-Q4",
    }


@router.get("/trends")
async def get_market_trends(
    product_code: str | None = None,
    db: AsyncSession = Depends(get_db)
) -> dict:
    """
    Аналітика трендів за УКТЗЕД кодами.
    """
    try:
        # Агрегація за місяцями
        query = select(
            func.date_trunc('month', Declaration.declaration_date).label('month'),
            func.sum(Declaration.value_usd).label('total_value'),
            func.count(Declaration.id).label('count')
        ).group_by('month').order_by('month')
        
        if product_code:
            query = query.where(Declaration.product_code == product_code)
            
        result = await db.execute(query)
        data = result.all()
        
        return {
            "trends": [
                {
                    "date": row.month.isoformat() if row.month else None,
                    "value_usd": float(row.total_value or 0),
                    "count": int(row.count)
                } for row in data
            ]
        }
    except Exception as e:
        return {"error": str(e), "trends": []}


@router.get("/share")
async def get_market_share(
    top: int = Query(default=10, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
) -> dict:
    """
    Розподіл ринку між компаніями (Market Share).
    """
    try:
        # ТОП компаній за обсягом
        query = select(
            Declaration.company_name,
            func.sum(Declaration.value_usd).label('total_value')
        ).group_by(Declaration.company_name).order_by(func.sum(Declaration.value_usd).desc()).limit(top)
        
        result = await db.execute(query)
        data = result.all()
        
        total_market_query = select(func.sum(Declaration.value_usd))
        total_market_value = (await db.execute(total_market_query)).scalar() or 1.0 # Avoid division by zero
        
        return {
            "share": [
                {
                    "company": row.company_name,
                    "value_usd": float(row.total_value or 0),
                    "percent": int((float(row.total_value or 0) / float(total_market_value)) * 100 * 100) / 100.0
                } for row in data
            ]
        }
    except Exception as e:
        return {"error": str(e), "share": []}


@router.get("/declarations")
async def get_declarations(
    limit: int = Query(default=50, ge=1, le=500),
    page: int = Query(default=1, ge=1),
    db: AsyncSession = Depends(get_db)
) -> dict:
    """
    Список митних декларацій з пагінацією.
    """
    try:
        offset = (page - 1) * limit
        query = select(Declaration).order_by(Declaration.declaration_date.desc()).offset(offset).limit(limit)
        count_query = select(func.count(Declaration.id))
        
        items = (await db.execute(query)).scalars().all()
        total = (await db.execute(count_query)).scalar() or 0
        
        return {
            "items": [
                {
                    "id": str(d.id),
                    "declaration_number": d.declaration_number,
                    "declaration_date": d.declaration_date.isoformat(),
                    "company_name": d.company_name,
                    "product_code": d.product_code,
                    "product_name": d.product_name,
                    "country_code": d.country_code,
                    "value_usd": float(d.value_usd or 0),
                    "anomaly_score": d.anomaly_score
                } for d in items
            ],
            "total": total,
            "page": page,
            "limit": limit,
        }
    except Exception as e:
        return {"error": str(e), "items": [], "total": 0}
from app.services.ml.insights_service import get_insights_service, InsightsService

@router.get("/insights")
async def get_market_insights(
    insights_service: InsightsService = Depends(get_insights_service)
) -> dict:
    """
    Отримати автоматичні інсайти по ринку.
    """
    insights = await insights_service.generate_market_insights()
    return {"insights": [i.to_dict() for i in insights]}
