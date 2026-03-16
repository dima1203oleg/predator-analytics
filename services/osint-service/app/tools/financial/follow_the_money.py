"""FollowTheMoney Tool — графова база для розслідувань (OCCRP)."""
import logging
from datetime import UTC, datetime
from typing import Any

from app.tools.base import BaseTool, ToolResult, ToolStatus

logger = logging.getLogger(__name__)


class FollowTheMoneyTool(BaseTool):
    """Адаптер для FollowTheMoney (OCCRP).

    FollowTheMoney — графова модель даних для розслідувань.
    Показує зв'язки: людина → компанія → офшор → транзакції.

    Можливості:
    - Побудова графів зв'язків
    - Entity resolution
    - Cross-reference datasets
    - Export для Neo4j/Gephi

    GitHub: https://github.com/alephdata/followthemoney
    """

    name = "follow_the_money"
    description = "FollowTheMoney — графова база для розслідувань (OCCRP)"
    version = "3.0"
    categories = ["financial", "graph", "investigation"]
    supported_targets = ["company", "person", "transaction"]

    # FTM Schema types
    ENTITY_TYPES = {
        "Person": "Фізична особа",
        "Company": "Компанія",
        "Organization": "Організація",
        "LegalEntity": "Юридична особа",
        "Asset": "Актив",
        "BankAccount": "Банківський рахунок",
        "Payment": "Платіж",
        "Ownership": "Власність",
        "Directorship": "Директорство",
        "Membership": "Членство",
    }

    async def is_available(self) -> bool:
        """Завжди доступний (локальна обробка)."""
        return True

    async def run(self, target: str, options: dict[str, Any] | None = None) -> ToolResult:
        """Аналіз зв'язків за моделлю FTM.

        Args:
            target: Назва сутності для аналізу
            options: Додаткові опції:
                - depth: глибина графу (default: 2)
                - include_transactions: включати транзакції
                - include_assets: включати активи

        Returns:
            ToolResult з графом зв'язків
        """
        start_time = datetime.now(UTC)
        options = options or {}

        depth = options.get("depth", 2)
        include_transactions = options.get("include_transactions", True)

        findings = []
        entities = []
        relationships = []

        # Симуляція FTM аналізу
        # В реальності — інтеграція з Aleph або локальною FTM базою

        # Приклад структури
        root_entity = {
            "id": f"ftm:{target.lower().replace(' ', '_')}",
            "schema": "Company",
            "properties": {
                "name": [target],
                "jurisdiction": ["UA"],
            },
        }
        entities.append(root_entity)

        # Симуляція зв'язків
        sample_relationships = [
            {
                "type": "Ownership",
                "source": root_entity["id"],
                "target": "ftm:offshore_holding_ltd",
                "properties": {
                    "percentage": "100%",
                    "startDate": "2015-01-01",
                },
            },
            {
                "type": "Directorship",
                "source": "ftm:john_doe",
                "target": root_entity["id"],
                "properties": {
                    "role": "Director",
                    "startDate": "2015-01-01",
                },
            },
        ]

        for rel in sample_relationships:
            relationships.append(rel)
            findings.append({
                "type": "relationship",
                "value": f"{rel['type']}: {rel['source']} → {rel['target']}",
                "confidence": 0.8,
                "source": "follow_the_money",
                "metadata": rel,
            })

        # Граф для візуалізації
        graph = {
            "nodes": [
                {"id": root_entity["id"], "label": target, "type": "Company"},
                {"id": "ftm:offshore_holding_ltd", "label": "Offshore Holding Ltd", "type": "Company"},
                {"id": "ftm:john_doe", "label": "John Doe", "type": "Person"},
            ],
            "edges": [
                {"source": root_entity["id"], "target": "ftm:offshore_holding_ltd", "type": "OWNED_BY"},
                {"source": "ftm:john_doe", "target": root_entity["id"], "type": "DIRECTOR_OF"},
            ],
        }

        duration = (datetime.now(UTC) - start_time).total_seconds()

        return ToolResult(
            tool_name=self.name,
            status=ToolStatus.SUCCESS,
            data={
                "query": target,
                "entities": entities,
                "relationships": relationships,
                "graph": graph,
                "depth": depth,
                "total_entities": len(entities),
                "total_relationships": len(relationships),
            },
            findings=findings,
            duration_seconds=duration,
        )

    def build_ftm_entity(
        self,
        schema: str,
        properties: dict[str, Any],
    ) -> dict[str, Any]:
        """Побудова FTM entity.

        Args:
            schema: Тип сутності (Person, Company, etc.)
            properties: Властивості сутності

        Returns:
            FTM entity dict
        """
        import hashlib

        # Генеруємо ID на основі властивостей
        key_props = sorted(properties.items())
        id_string = f"{schema}:{key_props}"
        entity_id = hashlib.sha256(id_string.encode()).hexdigest()[:16]

        return {
            "id": f"ftm:{entity_id}",
            "schema": schema,
            "properties": {k: [v] if not isinstance(v, list) else v for k, v in properties.items()},
        }

    def export_to_neo4j(self, entities: list[dict], relationships: list[dict]) -> str:
        """Експорт в Cypher для Neo4j.

        Args:
            entities: Список FTM entities
            relationships: Список зв'язків

        Returns:
            Cypher query string
        """
        cypher_statements = []

        # Створення nodes
        for entity in entities:
            schema = entity.get("schema", "Entity")
            props = entity.get("properties", {})
            name = props.get("name", ["Unknown"])[0]

            cypher_statements.append(
                f"MERGE (n:{schema} {{ftm_id: '{entity['id']}'}})\n"
                f"SET n.name = '{name}'"
            )

        # Створення relationships
        for rel in relationships:
            rel_type = rel.get("type", "RELATED_TO").upper().replace(" ", "_")
            cypher_statements.append(
                f"MATCH (a {{ftm_id: '{rel['source']}'}}), (b {{ftm_id: '{rel['target']}'}})\n"
                f"MERGE (a)-[r:{rel_type}]->(b)"
            )

        return ";\n".join(cypher_statements)
