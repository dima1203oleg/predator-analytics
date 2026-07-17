"""Neo4j Sink — PREDATOR Analytics v61.0-ELITE Ironclad.

Запис вузлів та зв'язків у Neo4j для графової аналітики.
"""
from typing import Any

from app.config import get_settings
from predator_common.logging import get_logger

logger = get_logger("ingestion_worker.neo4j")
settings = get_settings()

# Опціональний імпорт — не падаємо якщо neo4j недоступний
try:
    from neo4j import AsyncGraphDatabase
except ImportError:
    AsyncGraphDatabase = None  # type: ignore


class Neo4jSink:
    """Сінк для запису в Neo4j."""

    def __init__(self) -> None:
        """Ініціалізація Neo4j клієнта."""
        self.driver = None
        if AsyncGraphDatabase is None:
            logger.warning("neo4j не встановлено — Neo4j недоступний")
            return
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

    async def upsert_company(self, data: dict[str, Any]) -> str | None:
        """Створення або оновлення вузла компанії."""
        if not self._connected or not self.driver:
            return "Neo4j connection not available, skipping"

        ueid = data.get("ueid")
        if not ueid:
            return None

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

    async def merge_ownership_graph(self, graph_data: dict[str, Any]) -> None:
        """Зберегти граф власності.
        
        graph_data очікується у форматі OwnershipGraph.model_dump()
        """
        if not self._connected or not self.driver:
            return

        nodes = graph_data.get("nodes", [])
        edges = graph_data.get("edges", [])

        if not nodes:
            return

        try:
            async with self.driver.session() as session:
                # Створюємо вершини
                for node in nodes:
                    node_type = node.get("node_type", "company").capitalize()
                    node_id = node.get("node_id")
                    label = node.get("label", "")
                    props = node.get("properties", {})
                    
                    # Додаємо node_id та label в props для зручності
                    props["id"] = node_id
                    props["name"] = label

                    query = f"""
                    MERGE (n:{node_type} {{id: $node_id}})
                    SET n += $props
                    """
                    await session.run(query, {"node_id": node_id, "props": props})

                # Створюємо зв'язки
                for edge in edges:
                    source_id = edge.get("source_id")
                    target_id = edge.get("target_id")
                    rel_type = edge.get("relationship", "RELATED_TO").upper()
                    props = edge.get("properties", {})

                    query = f"""
                    MATCH (source {{id: $source_id}})
                    MATCH (target {{id: $target_id}})
                    MERGE (source)-[r:{rel_type}]->(target)
                    SET r += $props
                    """
                    await session.run(query, {"source_id": source_id, "target_id": target_id, "props": props})
                    
            logger.info(f"Збережено {len(nodes)} вузлів та {len(edges)} зв'язків у Neo4j")
        except Exception as e:
            logger.error(f"Failed to merge ownership graph: {e}")

    async def run_query(self, query: str, params: dict[str, Any] | None = None) -> Any:
        """Виконує довільний Cypher запит."""
        if not self._connected or not self.driver:
            return None

        try:
            async with self.driver.session() as session:
                result = await session.run(query, params or {})
                return await result.data()
        except Exception as e:
            logger.error(f"Failed to execute Neo4j query: {e}", extra={"query": query})
            raise

    async def close(self) -> None:
        """Закриття з'єднання."""
        if self.driver:
            await self.driver.close()
            self._connected = False
