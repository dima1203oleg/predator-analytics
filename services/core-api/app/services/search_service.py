"""Search Service — PREDATOR Analytics v55.1 Ironclad.

Vector search (LanceDB) and full-text search (PostgreSQL/OpenSearch).
"""
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.orm import Company


class SearchService:
    @staticmethod
    async def hybrid_search_companies(
        query: str,
        db: AsyncSession,
        limit: int = 20
    ) -> list[Company]:
        """Гібридний пошук компаній (текст + вектор)."""
        # TODO: Інтеграція з LanceDB для векторного пошуку
        # Наразі простий ILIKE пошук для стабільності
        result = await db.execute(
            select(Company)
            .where(Company.name.ilike(f"%{query}%"))
            .limit(limit)
        )
        return result.scalars().all()

    @staticmethod
    async def recommend_similar_entities(
        ueid: str,
        limit: int = 5
    ) -> list[dict[str, Any]]:
        """Пошук схожих сутностей на основі векторних ембедінгів."""
        # TODO: Vector similarity query via LanceDB
        return []
