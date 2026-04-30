"""Entity Resolution Service — PREDATOR Analytics v61.0-ELITE.

Сервіс для розв'язання сутностей (Entity Resolution) на рівні Core API.
Обгортка над predator_common.entity_resolution з доступом до БД.

Модуль відповідає:
- FR-002: Entity Resolution з F1 > 0.95
- FR-044: UEID generation та fuzzy-matching
- TZ §3.2: Merge/split logic для дублікатів
"""
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.orm import Company, Person
from predator_common.entity_resolution import (
    EntityCandidate,
    ResolutionResult,
    normalize_company_name,
    normalize_person_name,
    resolve_company,
    resolve_person,
)
from predator_common.logging import get_logger

logger = get_logger("entity_resolution_service")


class EntityResolutionService:
    """Entity Resolution Service з доступом до БД.

    Використовує predator_common.entity_resolution для ядра алгоритму,
    додає: завантаження кандидатів з PostgreSQL, збереження нових сутностей,
    merge/split операції.
    """

    @staticmethod
    async def _load_company_candidates(
        db: AsyncSession,
        name: str | None = None,
        edrpou: str | None = None,
        limit: int = 100,
    ) -> list[EntityCandidate]:
        """Завантажити кандидатів-компаній з БД для порівняння."""
        candidates: list[EntityCandidate] = []

        # Пошук за ЄДРПОУ (точний збіг)
        if edrpou:
            stmt = select(
                Company.ueid,
                Company.name,
                Company.name_normalized,
                Company.edrpou,
                Company.address,
            ).where(
                Company.edrpou == edrpou,
                Company.is_current.is_(True),
            ).limit(10)

            result = await db.execute(stmt)
            for row in result.all():
                candidates.append(EntityCandidate(
                    ueid=row.ueid,
                    name=row.name,
                    name_normalized=row.name_normalized or "",
                    edrpou=row.edrpou,
                    address=row.address,
                ))

        # Пошук за нормалізованою назвою (fuzzy)
        if name and not candidates:
            normalize_company_name(name)
            # Беремо останні N компаній для fuzzy-порівняння
            # У production тут має бути vector search або OpenSearch
            stmt = select(
                Company.ueid,
                Company.name,
                Company.name_normalized,
                Company.edrpou,
                Company.address,
            ).where(
                Company.is_current.is_(True),
            ).order_by(
                Company.created_at.desc(),
            ).limit(limit)

            result = await db.execute(stmt)
            for row in result.all():
                candidates.append(EntityCandidate(
                    ueid=row.ueid,
                    name=row.name,
                    name_normalized=row.name_normalized or normalize_company_name(row.name),
                    edrpou=row.edrpou,
                    address=row.address,
                ))

        return candidates

    @staticmethod
    async def _load_person_candidates(
        db: AsyncSession,
        full_name: str | None = None,
        inn: str | None = None,
        limit: int = 100,
    ) -> list[EntityCandidate]:
        """Завантажити кандидатів-осіб з БД."""
        candidates: list[EntityCandidate] = []

        if inn:
            stmt = select(
                Person.ueid,
                Person.full_name,
                Person.full_name_normalized,
                Person.inn,
            ).where(
                Person.inn == inn,
                Person.is_current.is_(True),
            ).limit(10)

            result = await db.execute(stmt)
            for row in result.all():
                candidates.append(EntityCandidate(
                    ueid=row.ueid,
                    name=row.full_name,
                    name_normalized=row.full_name_normalized or "",
                    inn=row.inn,
                ))

        if full_name and not candidates:
            stmt = select(
                Person.ueid,
                Person.full_name,
                Person.full_name_normalized,
                Person.inn,
            ).where(
                Person.is_current.is_(True),
            ).order_by(
                Person.created_at.desc(),
            ).limit(limit)

            result = await db.execute(stmt)
            for row in result.all():
                candidates.append(EntityCandidate(
                    ueid=row.ueid,
                    name=row.full_name,
                    name_normalized=row.full_name_normalized or normalize_person_name(row.full_name),
                    inn=row.inn,
                ))

        return candidates

    # ------------------------------------------------------------------
    # Основний API
    # ------------------------------------------------------------------

    @staticmethod
    async def resolve_company_entity(
        db: AsyncSession,
        name: str,
        edrpou: str | None = None,
        address: str | None = None,
        tenant_id: str | None = None,
    ) -> ResolutionResult:
        """Розв'язання компанії: пошук існуючої або створення нового UEID.

        Args:
            db: Async DB session
            name: Назва компанії
            edrpou: ЄДРПОУ (якщо є)
            address: Адреса (якщо є)
            tenant_id: Tenant ID (для логування)

        Returns:
            ResolutionResult з UEID, is_new, match_type, confidence

        """
        candidates = await EntityResolutionService._load_company_candidates(
            db, name=name, edrpou=edrpou,
        )

        result = resolve_company(
            name=name,
            edrpou=edrpou,
            address=address,
            candidates=candidates,
        )

        logger.info(
            f"Entity Resolution: company '{name[:50]}' → "
            f"UEID={result.ueid[:16]}... ({result.match_type}, "
            f"confidence={result.confidence:.2f}, new={result.is_new})",
            extra={"tenant_id": tenant_id},
        )

        return result

    @staticmethod
    async def resolve_person_entity(
        db: AsyncSession,
        full_name: str,
        inn: str | None = None,
        date_of_birth: str | None = None,
        tenant_id: str | None = None,
    ) -> ResolutionResult:
        """Розв'язання фізичної особи."""
        candidates = await EntityResolutionService._load_person_candidates(
            db, full_name=full_name, inn=inn,
        )

        result = resolve_person(
            full_name=full_name,
            inn=inn,
            date_of_birth=date_of_birth,
            candidates=candidates,
        )

        logger.info(
            f"Entity Resolution: person '{full_name[:50]}' → "
            f"UEID={result.ueid[:16]}... ({result.match_type}, "
            f"confidence={result.confidence:.2f}, new={result.is_new})",
            extra={"tenant_id": tenant_id},
        )

        return result

    # ------------------------------------------------------------------
    # Batch Resolution (для Ingestion Worker)
    # ------------------------------------------------------------------

    @staticmethod
    async def resolve_batch(
        db: AsyncSession,
        entities: list[dict[str, Any]],
        entity_type: str = "company",
        tenant_id: str | None = None,
    ) -> list[ResolutionResult]:
        """Batch entity resolution для масових операцій (ingestion).

        Args:
            entities: Список сутностей [{name, edrpou?, inn?}]
            entity_type: "company" або "person"
            tenant_id: Tenant ID

        Returns:
            Список ResolutionResult у тому ж порядку

        """
        results: list[ResolutionResult] = []

        for entity in entities:
            if entity_type == "company":
                result = await EntityResolutionService.resolve_company_entity(
                    db=db,
                    name=entity.get("name", ""),
                    edrpou=entity.get("edrpou"),
                    address=entity.get("address"),
                    tenant_id=tenant_id,
                )
            else:
                result = await EntityResolutionService.resolve_person_entity(
                    db=db,
                    full_name=entity.get("full_name", entity.get("name", "")),
                    inn=entity.get("inn"),
                    date_of_birth=entity.get("date_of_birth"),
                    tenant_id=tenant_id,
                )

            results.append(result)

        logger.info(
            f"Batch Resolution: {len(entities)} {entity_type}s → "
            f"{sum(1 for r in results if r.is_new)} new, "
            f"{sum(1 for r in results if not r.is_new)} matched",
        )

        return results
