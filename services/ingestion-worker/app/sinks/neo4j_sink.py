"""Neo4j Sink — PREDATOR Analytics v61.0-ELITE Ironclad.

Запис вузлів та зв'язків у Neo4j для графової аналітики.
"""
from typing import Any

from neo4j import AsyncGraphDatabase

from app.config import get_settings
from predator_common.logging import get_logger

logger = get_logger("ingestion_worker.neo4j")
settings = get_settings()


class Neo4jSink:
    """Сінк для запису в Neo4j."""

    def __init__(self) -> None:
        """Ініціалізація Neo4j клієнта."""
        try:
            self.driver = AsyncGraphDatabase.driver(
                settings.NEO4J_URI,
                auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD),
            )
            self._connected = True
            logger.info(f"Neo4j connected: {settings.NEO4J_URI}")
        except Exception as e:
            logger.warning(f"Neo4j connection failed: {e}")
            self.driver = None
            self._connected = False

    async def upsert_company(self, data: dict[str, Any]) -> None:
        """Створення або оновлення вузла компанії."""
        if not self._connected or not self.driver:
            return

        ueid = data.get("ueid")
        if not ueid:
            return

        query = """
        MERGE (c:Company {ueid: $ueid})
        SET c += {
            name: $name,
            edrpou: $edrpou,
            tenant_id: $tenant_id,
            declaration_number: $declaration_number,
            uktzed_code: $uktzed_code,
            country_origin: $country_origin,
            last_updated: datetime()
        }
        """
        try:
            async with self.driver.session() as session:
                await session.run(
                    query,
                    {
                        "ueid": ueid,
                        "name": data.get("company_name"),
                        "edrpou": data.get("company_edrpou"),
                        "tenant_id": data.get("_tenant_id"),
                        "declaration_number": data.get("declaration_number"),
                        "uktzed_code": data.get("uktzed_code"),
                        "country_origin": data.get("country_origin"),
                    },
                )
        except Exception as e:
            logger.error(f"Failed to upsert company in Neo4j: {e}")

    async def create_trade_relationship(
        self,
        importer_ueid: str,
        country_code: str,
        uktzed_code: str,
        value: float,
    ) -> None:
        """Створює зв'язок IMPORTS_FROM між компанією та країною."""
        if not self._connected or not self.driver:
            return

        query = """
        MATCH (c:Company {ueid: $importer_ueid})
        MERGE (country:Country {code: $country_code})
        MERGE (c)-[r:IMPORTS_FROM]->(country)
        SET r.uktzed_code = $uktzed_code,
            r.total_value = coalesce(r.total_value, 0) + $value,
            r.last_updated = datetime()
        """
        try:
            async with self.driver.session() as session:
                await session.run(
                    query,
                    {
                        "importer_ueid": importer_ueid,
                        "country_code": country_code,
                        "uktzed_code": uktzed_code,
                        "value": value,
                    },
                )
        except Exception as e:
            logger.error(f"Failed to create trade relationship: {e}")

    async def merge_company(self, data: dict[str, Any]) -> None:
        """Створення або оновлення вузла компанії (legacy)."""
        await self.upsert_company(data)

    async def close(self) -> None:
        """Закриття з'єднання."""
        if self.driver:
            await self.driver.close()
            self._connected = False
