"""Risk Service — PREDATOR Analytics v55.1 Ironclad.

Orchestrates CERS scoring and persistence.
"""

from sqlalchemy import select, text, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.orm import Company, Person
from predator_common.cers_score import Cers5LayerFactors, compute_cers_v55


class RiskService:
    @staticmethod
    async def update_company_risk(
        ueid: str,
        factors: Cers5LayerFactors,
        db: AsyncSession
    ) -> Company | None:
        """Обчислення та оновлення ризику для компанії."""
        result = compute_cers_v55(factors)

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
        factors: Cers5LayerFactors,
        db: AsyncSession
    ) -> Person | None:
        """Обчислення та оновлення ризику для особи."""
        result = compute_cers_v55(factors)

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
