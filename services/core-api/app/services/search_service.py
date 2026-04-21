"""Search Service — PREDATOR Analytics v56.5-ELITE.

Гібридний пошук: PostgreSQL ILIKE + OpenSearch (Фаза 2: Qdrant vector).
КРИТИЧНО: кожен запит фільтрується за tenant_id (TZ v5.0 §3.1).
"""
import logging
from typing import Any
from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.orm import Company
from app.services.ere_service import EREService

logger = logging.getLogger(__name__)


class SearchService:
    """Сервіс пошуку з обов'язковою tenant isolation."""

    @staticmethod
    async def hybrid_search_companies(
        query: str,
        db: AsyncSession,
        tenant_id: UUID | str,
        limit: int = 20,
    ) -> list[Company]:
        """Гібридний пошук компаній (текст + вектор).

        Args:
            query: Пошуковий запит
            db: Async database session
            tenant_id: UUID тенанта (обов'язково для RLS)
            limit: Максимальна кількість результатів
        """
        result = await db.execute(
            select(Company)
            .where(
                Company.tenant_id == str(tenant_id),
                Company.name.ilike(f"%{query}%"),
            )
            .limit(limit)
        )
        companies = list(result.scalars().all())

        # TODO: Фаза 2 — додати Qdrant vector reranking для покращення релевантності
        return companies

    @staticmethod
    async def recommend_similar_entities(
        ueid: str,
        db: AsyncSession,
        tenant_id: UUID | str,
        limit: int = 5,
    ) -> list[dict[str, Any]]:
        """Пошук схожих сутностей на основі векторних ембедінгів.

        Args:
            ueid: UEID сутності
            db: Async database session
            tenant_id: UUID тенанта (обов'язково для RLS)
            limit: Максимальна кількість результатів
        """
        try:
            # Отримуємо компанію за UEID (з tenant isolation)
            stmt = select(Company).where(
                Company.tenant_id == str(tenant_id),
                Company.ueid == ueid,
            )
            result = await db.execute(stmt)
            company = result.scalars().first()

            if not company:
                logger.warning("Company not found for UEID: %s в tenant: %s", ueid, tenant_id)
                return []

            # Фаза 3 — Vector similarity query через Qdrant (ERE)
            ere = EREService()
            text_context = f"{company.name} {company.industry} {company.description or ''}"
            duplicates = await ere.find_duplicates(tenant_id, text_context, threshold=0.7)

            if duplicates:
                return [
                    {
                        "id": d["entity_id"],
                        "ueid": d["metadata"].get("ueid"),
                        "name": d["metadata"].get("name"),
                        "similarity_score": d["score"],
                    }
                    for r in duplicates
                ]
            
            # Фоллбек (якщо в Qdrant нічого не знайдено)
            stmt = (
                select(Company)
                .where(
                    Company.tenant_id == str(tenant_id),
                    Company.industry == company.industry,
                    Company.ueid != ueid,
                )
                .limit(limit)
            )
            result = await db.execute(stmt)
            similar = list(result.scalars().all())

            return [
                {
                    "id": str(c.id),
                    "ueid": c.ueid,
                    "name": c.name,
                    "industry": c.industry,
                    "similarity_score": 0.0,  # TODO: Qdrant vector similarity score
                }
                for c in similar
            ]
        except Exception as e:
            logger.error("Error finding similar entities: %s", e)
            return []

    @staticmethod
    async def search_by_keywords(
        keywords: list[str],
        db: AsyncSession,
        tenant_id: UUID | str,
        limit: int = 20,
    ) -> list[Company]:
        """Пошук компаній за ключовими словами (з tenant isolation).

        Args:
            keywords: Список ключових слів
            db: Async database session
            tenant_id: UUID тенанта (обов'язково для RLS)
            limit: Максимальна кількість результатів
        """
        try:
            # Конструюємо OR запит для всіх ключових слів
            keyword_filters = [Company.name.ilike(f"%{keyword}%") for keyword in keywords]

            stmt = (
                select(Company)
                .where(
                    Company.tenant_id == str(tenant_id),
                    or_(*keyword_filters),
                )
                .limit(limit)
            )
            result = await db.execute(stmt)
            return list(result.scalars().all())
        except Exception as e:
            logger.error("Error searching by keywords: %s", e)
            return []
