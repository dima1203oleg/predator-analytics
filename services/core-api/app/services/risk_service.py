"""
Risk Service — PREDATOR Analytics v55.1 Ironclad.

Orchestrates CERS scoring and persistence.
"""
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, text

from predator_common.cers_score import CersFactors, compute_cers
from app.models.orm import Company, Person
from app.models.schemas import RiskLevel

class RiskService:
    @staticmethod
    async def update_company_risk(
        ueid: str, 
        factors: CersFactors, 
        db: AsyncSession
    ) -> Optional[Company]:
        """Обчислення та оновлення ризику для компанії."""
        result = compute_cers(factors)
        
        # Оновлення в БД
        await db.execute(
            update(Company)
            .where(Company.ueid == ueid)
            .values(
                risk_level=result.level.value,
                risk_score=result.score,
                updated_at=text("now()") # Will be handled by session but explicit for clarity
            )
        )
        await db.commit()
        
        # Reload
        res = await db.execute(select(Company).where(Company.ueid == ueid))
        return res.scalar_one_or_none()

    @staticmethod
    async def update_person_risk(
        ueid: str, 
        factors: CersFactors, 
        db: AsyncSession
    ) -> Optional[Person]:
        """Обчислення та оновлення ризику для особи."""
        result = compute_cers(factors)
        
        await db.execute(
            update(Person)
            .where(Person.ueid == ueid)
            .values(
                risk_level=result.level.value,
                risk_score=result.score
            )
        )
        await db.commit()
        
        res = await db.execute(select(Person).where(Person.ueid == ueid))
        return res.scalar_one_or_none()
