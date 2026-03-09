"""
Declarations Router — PREDATOR Analytics v55.1 Ironclad.

Customs declarations data access.
"""
from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.orm import CustomsDeclaration
from app.dependencies import PermissionChecker, get_tenant_id
from app.core.permissions import Permission

router = APIRouter(prefix="/declarations", tags=["declarations"])


@router.get("/")
async def list_declarations(
    skip: int = 0,
    limit: int = 100,
    company_ueid: Optional[str] = None,
    customs_code: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.READ_CUSTOMS]))
):
    """Отримання списку митних декларацій з розширеною фільтрацією."""
    query = select(CustomsDeclaration).where(CustomsDeclaration.tenant_id == tenant_id)
    
    if company_ueid:
        query = query.where(CustomsDeclaration.company_ueid == company_ueid)
    if customs_code:
        query = query.where(CustomsDeclaration.customs_code.startswith(customs_code))
    if date_from:
        query = query.where(CustomsDeclaration.date >= date_from)
    if date_to:
        query = query.where(CustomsDeclaration.date <= date_to)
        
    result = await db.execute(query.order_by(CustomsDeclaration.date.desc()).offset(skip).limit(limit))
    return result.scalars().all()


@router.get("/{declaration_id}")
async def get_declaration(
    declaration_id: str,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.READ_CUSTOMS]))
):
    """Детальна інформація про конкретну декларацію."""
    result = await db.execute(
        select(CustomsDeclaration).where(
            CustomsDeclaration.id == declaration_id, 
            CustomsDeclaration.tenant_id == tenant_id
        )
    )
    declaration = result.scalar_one_or_none()
    
    if not declaration:
        raise HTTPException(status_code=404, detail="Декларацію не знайдено")
        
    return declaration
