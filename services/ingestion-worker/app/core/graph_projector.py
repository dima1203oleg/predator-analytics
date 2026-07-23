"""Graph Projector — Проекція подій Kafka в графову базу Neo4j (FollowTheMoney).

Цей модуль приймає нормалізовані події з `CoreConsumer`, викликає
`ResolutionService` для вирішення ідентичностей (Entity Resolution) та
формує Cypher-запити для завантаження в Neo4j.
"""

import logging
from typing import Any

from app.core.neo4j_auto_sync import get_neo4j_auto_sync
from app.core.resolution import ResolutionService

logger = logging.getLogger("ingestion.projector")


class GraphProjector:
    """Проектує події у графи Neo4j."""

    def __init__(self) -> None:
        self.resolution_service = ResolutionService()
        self.neo4j_sync = get_neo4j_auto_sync()
        self.driver = self.neo4j_sync.neo4j_driver

    async def process_event(self, topic: str, event: dict[str, Any]) -> None:
        """Головний метод обробки події."""
        tenant_id = event.get("tenant_id", "default")
        payload = event.get("payload", {})
        event_type = event.get("event_type", "unknown")

        logger.debug(f"[GraphProjector] Обробка події {event_type} з топіку {topic}")

        if "company" in event_type.lower() or "organization" in event_type.lower():
            await self._project_company(payload, tenant_id)
        elif "person" in event_type.lower() or "pep" in event_type.lower():
            await self._project_person(payload, tenant_id)
        elif "sanction" in event_type.lower():
            await self._project_sanction(payload, tenant_id)
        elif "threat" in event_type.lower() or "cve" in event_type.lower():
            await self._project_threat(payload, tenant_id)
        elif event_type == "raw_node":
            await self.project_raw_node(payload)
        elif event_type == "raw_edge":
            await self.project_raw_edge(payload)
        else:
            logger.warning(f"[GraphProjector] Невідомий тип події: {event_type}. Пропускаємо.")

    async def _project_company(self, data: dict[str, Any], tenant_id: str) -> None:
        """Проектує компанію у граф."""
        # 1. Entity Resolution
        resolved_company = await self.resolution_service.resolve_company(data, tenant_id)
        ueid = resolved_company.get("ueid")
        name = resolved_company.get("name")

        if not ueid:
            logger.error("Не вдалося отримати UEID для компанії. Відхилено.")
            return

        # 2. Формування Cypher запиту
        cypher = """
        MERGE (c:Company {ueid: $ueid})
        SET c.name = $name,
            c.tenant_id = $tenant_id,
            c.last_updated = datetime()
        """
        params = {"ueid": ueid, "name": name, "tenant_id": tenant_id}
        await self._execute_cypher(cypher, params)
        logger.info(f"🏢 Projected Company: {name} ({ueid})")

    async def _project_person(self, data: dict[str, Any], tenant_id: str) -> None:
        """Проектує фізичну особу (Person) у граф."""
        # 1. Entity Resolution
        resolved_person = await self.resolution_service.resolve_person(data, tenant_id)
        ueid = resolved_person.get("ueid")
        name = resolved_person.get("name", data.get("name", "Unknown Person"))

        if not ueid:
            logger.error("Не вдалося отримати UEID для особи. Відхилено.")
            return

        # 2. Формування Cypher запиту
        cypher = """
        MERGE (p:Person {ueid: $ueid})
        SET p.name = $name,
            p.tenant_id = $tenant_id,
            p.last_updated = datetime()
        """
        params = {"ueid": ueid, "name": name, "tenant_id": tenant_id}
        await self._execute_cypher(cypher, params)
        logger.info(f"👤 Projected Person: {name} ({ueid})")

        # Додатково: зв'язок з компанією, якщо він є у payload
        if "related_company_name" in data:
            company_data = {"name": data["related_company_name"]}
            rel_company = await self.resolution_service.resolve_company(company_data, tenant_id)
            comp_ueid = rel_company.get("ueid")

            if comp_ueid:
                rel_cypher = """
                MATCH (p:Person {ueid: $p_ueid}), (c:Company {ueid: $c_ueid})
                MERGE (p)-[r:ASSOCIATED_WITH]->(c)
                SET r.last_updated = datetime()
                """
                await self._execute_cypher(rel_cypher, {"p_ueid": ueid, "c_ueid": comp_ueid})
                logger.info(f"🔗 Link: Person({ueid}) -> Company({comp_ueid})")

    async def _project_sanction(self, data: dict[str, Any], tenant_id: str) -> None:
        """Проектує подію санкції."""
        target_name = data.get("target_name")
        program = data.get("program", "Unknown Program")

        logger.info(f"🚫 Projected Sanction for: {target_name} (Program: {program})")
        # Тут буде складна логіка розпізнавання: чи це людина, чи компанія.
        # Збережемо абстрактну подію "Sanction"
        cypher = """
        MERGE (s:Sanction {id: $sanction_id})
        SET s.program = $program, s.target_name = $target_name
        """
        await self._execute_cypher(
            cypher,
            {
                "sanction_id": data.get("id", "s-unknown"),
                "program": program,
                "target_name": target_name,
            },
        )

    async def _project_threat(self, data: dict[str, Any], tenant_id: str) -> None:
        """Проектує подію кіберзагрози (CVE / AlienVault)."""
        cve = data.get("cve_id", data.get("indicator", "unknown"))
        logger.info(f"☣️ Projected Threat: {cve}")

        cypher = """
        MERGE (v:Vulnerability {cve: $cve})
        SET v.last_seen = datetime()
        """
        await self._execute_cypher(cypher, {"cve": cve})

    async def _execute_cypher(self, cypher: str, params: dict[str, Any]) -> None:
        """Виконує Cypher-запит, якщо драйвер Neo4j доступний."""
        if not self.driver:
            logger.debug(f"[GraphProjector - DRY RUN] {cypher} | params: {params}")
            return

        try:
            async with self.driver.session() as session:
                await session.run(cypher, params)
        except Exception as e:
            logger.error(f"[GraphProjector] Помилка виконання Cypher: {e}")

    async def project_raw_node(self, node_data: dict[str, Any]) -> None:
        """Зберігає абстрактний вузол (FtM формат)."""
        label = node_data.get("label", "Entity")
        node_id = node_data.get("id")
        props = node_data.get("props", {})

        if not node_id:
            return

        # Формуємо динамічний SET
        set_clauses = ["n.last_updated = datetime()"]
        for k in props.keys():
            set_clauses.append(f"n.`{k}` = ${k}")

        cypher = f"""
        MERGE (n:`{label}` {{id: $node_id}})
        SET {', '.join(set_clauses)}
        """
        params = {"node_id": node_id, **props}
        await self._execute_cypher(cypher, params)

    async def project_raw_edge(self, edge_data: dict[str, Any]) -> None:
        """Зберігає абстрактний зв'язок (FtM формат)."""
        rel_type = edge_data.get("rel_type", "RELATED_TO")
        source_id = edge_data.get("source_id")
        target_id = edge_data.get("target_id")
        props = edge_data.get("props", {})

        if not source_id or not target_id:
            return

        set_clauses = ["r.last_updated = datetime()"]
        for k in props.keys():
            set_clauses.append(f"r.`{k}` = ${k}")

        cypher = f"""
        MATCH (s {{id: $source_id}}), (t {{id: $target_id}})
        MERGE (s)-[r:`{rel_type}`]->(t)
        SET {', '.join(set_clauses)}
        """
        params = {"source_id": source_id, "target_id": target_id, **props}
        await self._execute_cypher(cypher, params)
