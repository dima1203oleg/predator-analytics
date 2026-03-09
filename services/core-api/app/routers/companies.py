"""
Companies Router — PREDATOR Analytics v55.1 Ironclad.

CRUD and analytics for companies.
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models.orm import Company
from app.models.schemas import CompanyResponse, RiskLevel
from app.dependencies import PermissionChecker, get_tenant_id
from app.core.permissions import Permission

router = APIRouter(prefix="/companies", tags=["companies"])


@router.get("/", response_model=List[CompanyResponse])
async def list_companies(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    risk_level: Optional[RiskLevel] = None,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA]))
):
    """Список компаній з фільтрацією."""
    query = select(Company).where(Company.tenant_id == tenant_id)
    
    if search:
        query = query.where(Company.name.ilike(f"%{search}%"))
    if risk_level:
        query = query.where(Company.risk_level == risk_level.value)
        
    result = await db.execute(query.offset(skip).limit(limit))
    return result.scalars().all()


@router.get("/{ueid}", response_model=CompanyResponse)
async def get_company(
    ueid: str,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA]))
):
    """Отримання детальної інформації про компанію за UEID."""
    result = await db.execute(
        select(Company).where(Company.ueid == ueid, Company.tenant_id == tenant_id)
    )
    company = result.scalar_one_or_none()
    
    if not company:
        raise HTTPException(status_code=404, detail="Компанію не знайдено")
        
    return company


@router.get("/{ueid}/stats")
async def get_company_stats(
    ueid: str,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA]))
):
    """Статистика по компанії (кількість декларацій тощо)."""
    # TODO: Implement aggregated stats
    return {"ueid": ueid, "total_declarations": 0, "total_valuation_usd": 0.0}
