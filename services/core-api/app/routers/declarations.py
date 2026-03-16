"""Declarations Router — PREDATOR Analytics v55.2-SM-EXTENDED.
Реалізація згідно з новим TZ: розширений пошук, аномалії та CERS інтеграція.
"""
from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import Permission

# Використання нових спільних модулів згідно TZ 31.1
from app.database import get_db  # Поки що використовуємо локальний, до завершення міграції в libs
from app.dependencies import PermissionChecker, get_tenant_id
from app.models.orm import Company, CustomsDeclaration

router = APIRouter(prefix="/declarations", tags=["декларації"])

# ======================== МОДЕЛІ ВІДПОВІДІ ========================

class ДеклараціяОтримання(BaseModel):
    """Модель декларації в результатах пошуку (v55.2)"""

    declaration_id: str = Field(..., description="UUID декларації")
    declaration_number: str = Field(..., description="Номер митної декларації")
    declaration_date: date = Field(..., description="Дата оформлення")
    importer_ueid: str | None = Field(None, description="UEID імпортера")
    importer_name: str | None = Field(None, description="Назва компанії-імпортера")
    hs_code: str = Field(..., description="Код УКТЗЕД (10 знаків)")
    product_name_uk: str | None = Field(None, description="Опис товару українською")
    customs_value_usd: float = Field(..., description="Митна вартість у USD")
    origin_country: str | None = Field(None, description="Країна походження (ISO 3166-1 alpha-2)")
    risk_score: int = Field(0, description="CERS ризик-скор (0-100)")
    confidence: float = Field(0.0, description="Впевненість алгоритму (0-1)")

    class Config:
        """Pydantic config."""

        from_attributes = True

class ПошукДеклараційВідповідь(BaseModel):
    """Контейнер для пагінованих результатів"""

    data: list[ДеклараціяОтримання]
    meta: dict = Field(..., description="Метадані пошуку (total, limit, offset)")


# ======================== ЕНДПОЇНТИ ========================

@router.get(
    "",
    response_model=ПошукДеклараційВідповідь,
    summary="Пошук декларацій (v55.2)",
    description="Пошук по номеру, EDRPOU або назві з фільтрацією по датах та кодах УКТЗЕД."
)
async def пошук_декларацій(
    search: Annotated[str | None, Query(description="Пошуковий запит (номер, EDRPOU, назва)")] = None,
    date_from: Annotated[date | None, Query(description="Дата 'з' (YYYY-MM-DD)")] = None,
    date_to: Annotated[date | None, Query(description="Дата 'по' (YYYY-MM-DD)")] = None,
    hs_code: Annotated[str | None, Query(description="Фільтр по коду УКТЗЕД")] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 25,
    offset: Annotated[int, Query(ge=0)] = 0,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.READ_CUSTOMS]))
) -> ПошукДеклараційВідповідь:
    """Основний ендпоїнт пошуку декларацій.
    Реалізує логіку фільтрації згідно зі станом 'v55.2-SM-EXTENDED'.
    """
    # Будуємо базовий запит з JOIN на компанію для отримання назви
    query = select(
        CustomsDeclaration,
        Company.name.label("importer_name"),
        Company.cers_score.label("company_risk")
    ).join(
        Company, CustomsDeclaration.importer_ueid == Company.ueid, isouter=True
    ).where(
        CustomsDeclaration.tenant_id == tenant_id
    )

    # Застосовуємо фільтри
    if date_from:
        query = query.where(CustomsDeclaration.declaration_date >= date_from)
    if date_to:
        query = query.where(CustomsDeclaration.declaration_date <= date_to)
    if hs_code:
        query = query.where(CustomsDeclaration.uktzed_code.startswith(hs_code))

    if search:
        search_pattern = f"%{search}%"
        query = query.where(or_(
            CustomsDeclaration.declaration_number.ilike(search_pattern),
            Company.edrpou.ilike(search_pattern),
            Company.name.ilike(search_pattern)
        ))

    # Обчислюємо загальну кількість для метаданих
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total_count = total_result.scalar() or 0

    # Отримуємо результати з пагінацією
    query = query.order_by(CustomsDeclaration.declaration_date.desc()).offset(offset).limit(limit)
    result = await db.execute(query)
    rows = result.all()

    # Мапінг результатів у формат відповіді
    declarations_list = []
    for row in rows:
        decl = row[0]
        declarations_list.append(ДеклараціяОтримання(
            declaration_id=decl.id,
            declaration_number=decl.declaration_number,
            declaration_date=decl.declaration_date.date() if hasattr(decl.declaration_date, "date") else decl.declaration_date,
            importer_ueid=decl.importer_ueid,
            importer_name=row.importer_name,
            hs_code=decl.uktzed_code,
            product_name_uk=decl.goods_description,
            customs_value_usd=float(decl.customs_value_usd or 0),
            origin_country=decl.country_origin,
            risk_score=row.company_risk or 0,
            confidence=0.95  # Заглушка для поточної версії алгоритму
        ))

    return ПошукДеклараційВідповідь(
        data=declarations_list,
        meta={
            "total": total_count,
            "limit": limit,
            "offset": offset,
            "has_next": (offset + limit) < total_count
        }
    )
