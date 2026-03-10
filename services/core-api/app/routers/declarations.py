"""
Declarations Router — PREDATOR Analytics v55.2-SM-EXTENDED.
Реалізація згідно з новим TZ: розширений пошук, аномалії та CERS інтеграція.
"""
from datetime import date
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, and_, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

# Використання нових спільних модулів згідно TZ 31.1
from app.database import get_db  # Поки що використовуємо локальний, до завершення міграції в libs
from app.dependencies import get_tenant_id, PermissionChecker
from app.core.permissions import Permission
from app.models.orm import CustomsDeclaration, Company

router = APIRouter(prefix="/declarations", tags=["декларації"])

# ======================== МОДЕЛІ ВІДПОВІДІ ========================

class ДеклараціяОтримання(BaseModel):
    """Модель декларації в результатах пошуку (v55.2)"""
    declaration_id: str = Field(..., description="UUID декларації")
    declaration_number: str = Field(..., description="Номер митної декларації")
    declaration_date: date = Field(..., description="Дата оформлення")
    importer_ueid: Optional[str] = Field(None, description="UEID імпортера")
    importer_name: Optional[str] = Field(None, description="Назва компанії-імпортера")
    hs_code: str = Field(..., description="Код УКТЗЕД (10 знаків)")
    product_name_uk: Optional[str] = Field(None, description="Опис товару українською")
    customs_value_usd: float = Field(..., description="Митна вартість у USD")
    origin_country: Optional[str] = Field(None, description="Країна походження (ISO 3166-1 alpha-2)")
    risk_score: int = Field(0, description="CERS ризик-скор (0-100)")
    confidence: float = Field(0.0, description="Впевненість алгоритму (0-1)")

    class Config:
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
    search: Annotated[Optional[str], Query(None, description="Пошуковий запит (номер, EDRPOU, назва)")] = None,
    date_from: Annotated[Optional[date], Query(None, description="Дата 'з' (YYYY-MM-DD)")] = None,
    date_to: Annotated[Optional[date], Query(None, description="Дата 'по' (YYYY-MM-DD)")] = None,
    hs_code: Annotated[Optional[str], Query(None, description="Фільтр по коду УКТЗЕД")] = None,
    limit: Annotated[int, Query(25, ge=1, le=100)] = 25,
    offset: Annotated[int, Query(0, ge=0)] = 0,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.READ_CUSTOMS]))
) -> ПошукДеклараційВідповідь:
    """
    Основний ендпоїнт пошуку декларацій.
    Реалізує логіку фільтрації згідно зі станом 'v55.2-SM-EXTENDED'.
    """
    
    # Будуємо базовий запит з JOIN на компанію для отримання назви
    query = select(
        CustomsDeclaration, 
        Company.name.label("importer_name"),
        Company.risk_score.label("company_risk")
    ).join(
        Company, CustomsDeclaration.company_ueid == Company.ueid, isouter=True
    ).where(
        CustomsDeclaration.tenant_id == tenant_id
    )

    # Застосовуємо фільтри
    if date_from:
        query = query.where(CustomsDeclaration.date >= date_from)
    if date_to:
        query = query.where(CustomsDeclaration.date <= date_to)
    if hs_code:
        query = query.where(CustomsDeclaration.customs_code.startswith(hs_code))
    
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
    query = query.order_by(CustomsDeclaration.date.desc()).offset(offset).limit(limit)
    result = await db.execute(query)
    rows = result.all()

    # Мапінг результатів у формат відповіді
    declarations_list = []
    for row in rows:
        decl = row[0]
        declarations_list.append(ДеклараціяОтримання(
            declaration_id=decl.id,
            declaration_number=decl.declaration_number,
            declaration_date=decl.date.date() if hasattr(decl.date, "date") else decl.date,
            importer_ueid=decl.company_ueid,
            importer_name=row.importer_name,
            hs_code=decl.customs_code,
            product_name_uk=decl.description,
            customs_value_usd=decl.amount_usd,
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
