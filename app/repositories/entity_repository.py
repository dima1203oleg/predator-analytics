"""Predator v55 ORM Repository — Entity (UEID)."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any
import uuid

from sqlalchemy import func, or_, select

from app.core.ueid import (
    fingerprint_entity,
    generate_deterministic_ueid,
    normalize_name,
    parse_ueid,
    validate_edrpou,
)
from app.models.v55.orm.entity import EntityORM

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger("predator.repo.entity")


class EntityRepository:
    """Repository for managing entities in the v55 schema."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_ueid(self, ueid: str | uuid.UUID) -> EntityORM | None:
        """Fetch entity by exact UEID."""
        parsed_uuid = parse_ueid(ueid)
        stmt = select(EntityORM).where(EntityORM.ueid == parsed_uuid)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_edrpou(self, edrpou: str) -> EntityORM | None:
        """Fetch entity by EDRPOU code."""
        stmt = select(EntityORM).where(EntityORM.edrpou == edrpou)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def search(self, query: str, entity_type: str | None = None, limit: int = 20, offset: int = 0) -> tuple[list[EntityORM], int]:
        """Search entities leveraging pg_trgm for fuzzy matching.

        Returns:
            Tuple of (entities list, total count)

        """
        normalized_query = normalize_name(query)
        if not normalized_query:
            return [], 0

        # If it looks like an EDRPOU/INN, search by that exactly
        if query.isdigit() and len(query) in (8, 10, 12, 14):
            stmt = select(EntityORM).where(or_(EntityORM.edrpou == query, EntityORM.inn == query))
        else:
            # Otherwise use pg_trgm SIMILARITY text search operator
            stmt = select(EntityORM).where(
                EntityORM.name_normalized.op("%%")(normalized_query)
            ).order_by(
                EntityORM.name_normalized.op("<->")(normalized_query)
            )

        if entity_type:
            stmt = stmt.where(EntityORM.entity_type == entity_type)

        # Execute search for items
        items_stmt = stmt.offset(offset).limit(limit)
        items_result = await self.session.execute(items_stmt)
        items = list(items_result.scalars().all())

        # In a real production environment with millions of rows,
        # we'd want a more optimized way to get the total count,
        # but for Phase 1 we'll use a simple count query.

        count_stmt = select(func.count()).select_from(stmt.subquery())
        count_result = await self.session.execute(count_stmt)
        total = count_result.scalar_one()

        return items, total

    async def resolve_or_create(
        self,
        name: str,
        entity_type: str,
        edrpou: str | None = None,
        inn: str | None = None,
        metadata: dict[str, Any] | None = None
    ) -> tuple[EntityORM, bool]:
        """Resolve entity by EDRPOU or Name+Type fingerprint, or create new.

        Returns:
            Tuple of (EntityORM, is_new boolean)

        """
        normalized = normalize_name(name)
        fingerprint = fingerprint_entity(name, edrpou)

        # 1. Try resolving by EDRPOU (exact match)
        if edrpou and validate_edrpou(edrpou):
            existing = await self.get_by_edrpou(edrpou)
            if existing:
                return existing, False

        # 2. Try resolving by exact Fingerprint
        stmt = select(EntityORM).where(EntityORM.fingerprint == fingerprint)
        result = await self.session.execute(stmt)
        existing_by_fp = result.scalar_one_or_none()

        if existing_by_fp:
            return existing_by_fp, False

        # 3. If no deterministic EDRPOU, check by exact normalized name (strict check proxy for fuzzy)
        if not edrpou:
             stmt = select(EntityORM).where(
                 EntityORM.name_normalized == normalized,
                 EntityORM.entity_type == entity_type
             )
             result = await self.session.execute(stmt)
             existing_by_name = result.scalar_one_or_none()
             if existing_by_name:
                 return existing_by_name, False

        # 4. Create new entity
        new_ueid = uuid.UUID(generate_deterministic_ueid(edrpou)) if edrpou and validate_edrpou(edrpou) else uuid.uuid4()

        entity = EntityORM(
            ueid=new_ueid,
            name=name,
            name_normalized=normalized,
            entity_type=entity_type,
            edrpou=edrpou,
            inn=inn,
            fingerprint=fingerprint,
            metadata_=metadata or {}
        )

        self.session.add(entity)
        # Flush to ensure ueid is generated/set correctly before returning
        await self.session.flush()

        logger.info(f"Created new entity: {name} ({edrpou or 'No EDRPOU'}) -> {new_ueid}")
        return entity, True
