"""Search Service — PREDATOR Analytics v55.1 Ironclad.

Vector search (LanceDB) and full-text search (PostgreSQL/OpenSearch).
"""
import logging
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.orm import Company

logger = logging.getLogger(__name__)


class SearchService:
    @staticmethod
    async def hybrid_search_companies(
        query: str,
        db: AsyncSession,
        limit: int = 20
    ) -> list[Company]:
        """Гібридний пошук компаній (текст + вектор)."""
        # Реалізація векторного пошуку через LanceDB
        # Спочатку простий ILIKE пошук для стабільності
        result = await db.execute(
            select(Company)
            .where(Company.name.ilike(f"%{query}%"))
            .limit(limit)
        )
        companies = result.scalars().all()

        # TODO: Додати vector embedding з LanceDB для ребранкування результатів
        # Коли LanceDB буде інтегрований, відсортувати за семантичною близькістю
        return companies

    @staticmethod
    async def recommend_similar_entities(
        ueid: str,
        db: AsyncSession,
        limit: int = 5
    ) -> list[dict[str, Any]]:
        """Пошук схожих сутностей на основі векторних ембедінгів."""
        # Реалізація через LanceDB vector similarity
        try:
            # Спочатку отримуємо компанію за UEID
            stmt = select(Company).where(Company.ueid == ueid)
            result = await db.execute(stmt)
            company = result.scalars().first()

            if not company:
                logger.warning(f"Company not found for UEID: {ueid}")
                return []

            # TODO: Vector similarity query via LanceDB
            # Коли LanceDB готовий, використовувати embedding коompany.description
            # та шукати найближчі вектори в K-NN індексі

            # Тимчасова реалізація: пошук схожих за галуззю
            stmt = select(Company).where(
                (Company.industry == company.industry) &
                (Company.ueid != ueid)
            ).limit(limit)
            result = await db.execute(stmt)
            similar = result.scalars().all()

            return [
                {
                    "id": c.id,
                    "ueid": c.ueid,
                    "name": c.name,
                    "industry": c.industry,
                    "similarity_score": 0.0  # TODO: Vector similarity score
                }
                for c in similar
            ]
        except Exception as e:  # type: ignore[misc]
            logger.error(f"Error finding similar entities: {e}")
            return []

    @staticmethod
    async def search_by_keywords(
        keywords: list[str],
        db: AsyncSession,
        limit: int = 20
    ) -> list[Company]:
        """Пошук компаній за ключовими словами."""
        try:
            # Конструюємо OR запит для всіх ключових слів
            filters = []
            for keyword in keywords:
                filters.append(Company.name.ilike(f"%{keyword}%"))

            from sqlalchemy import or_
            stmt = select(Company).where(or_(*filters)).limit(limit)
            result = await db.execute(stmt)
            return result.scalars().all()
        except Exception as e:  # type: ignore[misc]
            logger.error(f"Error searching by keywords: {e}")
            return []
