"""Market Intelligence Router — PREDATOR Analytics v61.0-ELITE.
"""
from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import Permission
from app.database import get_db
from app.dependencies import PermissionChecker, get_tenant_id, get_current_active_user
from app.models.orm import CustomsDeclaration
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/market", tags=["ринок"])

@router.get("/overview", summary="Загальний огляд ринку")
async def get_market_overview(
    tenant_id: str = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_active_user),
    _ = Depends(PermissionChecker([Permission.READ_INTEL]))
):
    analytics_service = AnalyticsService()
    ch_stats = analytics_service.get_dashboard_stats(str(tenant_id))

    # Форматуємо відповідно до того, що очікує фронтенд або старий API
    return {
        "total_value_usd": float(ch_stats.get("total_value_usd", 0)),
        "total_declarations": int(ch_stats.get("total_count", 0)),
        "top_categories": [
            {"code": code, "value": float(data["value"])}
            for code, data in ch_stats.get("categories", {}).items()
        ],
        "top_countries": [
            {"country": country, "count": int(data["count"])}
            for country, data in ch_stats.get("countries", {}).items()
        ]
    }

@router.get("/declarations", summary="Список декларацій (аналіз ринку)")
async def list_market_declarations(
    limit: int = 50,
    offset: int = 0,
    tenant_id: str = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_active_user),
    _ = Depends(PermissionChecker([Permission.READ_INTEL]))
):
    """Повертає список декларацій з обмеженим набором колонок (HR-07)."""
    stmt = (
        select(
            CustomsDeclaration.declaration_number,
            CustomsDeclaration.declaration_date,
            CustomsDeclaration.importer_name,
            CustomsDeclaration.exporter_name,
            CustomsDeclaration.uktzed_code,
            CustomsDeclaration.customs_value_usd
        )
        .where(CustomsDeclaration.tenant_id == tenant_id)
        .order_by(CustomsDeclaration.declaration_date.desc())
        .limit(limit)
        .offset(offset)
    )

    result = await db.execute(stmt)
    declarations = result.all()

    return [
        {
            "number": r.declaration_number,
            "date": r.declaration_date.isoformat() if r.declaration_date else None,
            "importer": r.importer_name,
            "exporter": r.exporter_name,
            "code": r.uktzed_code,
            "value": float(r.customs_value_usd) if r.customs_value_usd else 0.0
        } for r in declarations
    ]

@router.get("/product/{code}/stats", summary="Статистика по коду товару")
async def get_product_stats(
    code: str,
    tenant_id: str = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_active_user),
    _ = Depends(PermissionChecker([Permission.READ_INTEL]))
):
    """Аналізує динаміку та гравців по конкретному коду UKTZED."""
    # Середня ціна та обсяг
    stats = await db.execute(
        select(
            func.avg(CustomsDeclaration.price_per_unit_usd).label("avg_price"),
            func.sum(CustomsDeclaration.customs_value_usd).label("total_value"),
            func.count(CustomsDeclaration.id).label("count")
        )
        .where(CustomsDeclaration.uktzed_code.like(f"{code}%"))
        .where(CustomsDeclaration.tenant_id == tenant_id)
    )
    res = stats.one()

    # Основні імпортери
    importers = await db.execute(
        select(
            CustomsDeclaration.importer_name,
            func.sum(CustomsDeclaration.customs_value_usd).label("value")
        )
        .where(CustomsDeclaration.uktzed_code.like(f"{code}%"))
        .where(CustomsDeclaration.tenant_id == tenant_id)
        .group_by(CustomsDeclaration.importer_name)
        .order_by(func.sum(CustomsDeclaration.customs_value_usd).desc())
        .limit(5)
    )

    return {
        "code": code,
        "avg_price_usd": float(res.avg_price) if res.avg_price else 0.0,
        "total_value_usd": float(res.total_value) if res.total_value else 0.0,
        "transaction_count": res.count,
        "top_importers": [
            {"name": r.importer_name, "value": float(r.value)} for r in importers.all()
        ]
    }
