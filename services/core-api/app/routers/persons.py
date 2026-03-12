"""Persons Router — PREDATOR Analytics v55.1 Ironclad.

CRUD and analytics for physical persons.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import Permission
from app.database import get_db
from app.dependencies import PermissionChecker, get_tenant_id
from app.models.orm import Person
from app.models.schemas import PersonResponse, RiskLevel

router = APIRouter(prefix="/persons", tags=["persons"])


@router.get("/", response_model=list[PersonResponse])
async def list_persons(
    skip: int = 0,
    limit: int = 100,
    search: str | None = None,
    risk_level: RiskLevel | None = None,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA]))
):
    """Список фізичних осіб з фільтрацією."""
    query = select(Person).where(Person.tenant_id == tenant_id)

    if search:
        query = query.where(Person.full_name.ilike(f"%{search}%"))
    if risk_level:
        query = query.where(Person.risk_level == risk_level.value)

    result = await db.execute(query.offset(skip).limit(limit))
    return result.scalars().all()


@router.get("/{ueid}", response_model=PersonResponse)
async def get_person(
    ueid: str,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA]))
):
    """Отримання детальної інформації про особу за UEID."""
    result = await db.execute(
        select(Person).where(Person.ueid == ueid, Person.tenant_id == tenant_id)
    )
    person = result.scalar_one_or_none()

    if not person:
        raise HTTPException(status_code=404, detail="Особу не знайдено")

    return person
