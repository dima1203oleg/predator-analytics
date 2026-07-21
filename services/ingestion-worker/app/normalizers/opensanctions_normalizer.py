"""OpenSanctions (FollowTheMoney) Normalizer.

Транслює формат FtM (id, schema, properties) у Neo4j вузли та зв'язки.
"""
from typing import Any, Generator
import logging

logger = logging.getLogger("ingestion_worker.opensanctions_normalizer")

class OpenSanctionsNormalizer:
    """Конвертер FollowTheMoney -> Neo4j."""

    def __init__(self) -> None:
        self.node_mappings = {
            "Person": "Person",
            "Company": "Company",
            "Organization": "Organization",
            "Vessel": "Vessel",
            "Airplane": "Airplane",
            "Sanction": "Sanction",
            "LegalEntity": "Company",
        }

        self.edge_mappings = {
            "Ownership": {
                "source_prop": "owner",
                "target_prop": "asset",
                "rel_type": "OWNS",
            },
            "Directorship": {
                "source_prop": "director",
                "target_prop": "organization",
                "rel_type": "DIRECTOR_OF",
            },
            "Family": {
                "source_prop": "person",
                "target_prop": "relative",
                "rel_type": "FAMILY_OF",
            },
            "Associate": {
                "source_prop": "person",
                "target_prop": "associate",
                "rel_type": "ASSOCIATE_OF",
            },
            "Membership": {
                "source_prop": "member",
                "target_prop": "organization",
                "rel_type": "MEMBER_OF",
            },
        }

    def normalize(self, entity: dict[str, Any]) -> Generator[tuple[str, dict[str, Any]], None, None]:
        entity_id = entity.get("id")
        schema = entity.get("schema")
        properties = entity.get("properties", {})

        if not entity_id or not schema:
            return

        if schema in self.edge_mappings:
            mapping = self.edge_mappings[schema]
            sources = properties.get(mapping["source_prop"], [])
            targets = properties.get(mapping["target_prop"], [])
            edge_props = self._flatten_properties(properties)
            
            for source in sources:
                for target in targets:
                    yield ("edge", {
                        "source_id": source,
                        "target_id": target,
                        "rel_type": mapping["rel_type"],
                        "props": edge_props,
                    })
            return

        label = self.node_mappings.get(schema, schema)
        
        if schema == "Sanction":
            targets = properties.get("entity", [])
            sanction_props = self._flatten_properties(properties)
            yield ("node", {
                "label": "Sanction",
                "id": entity_id,
                "props": sanction_props,
            })
            for target in targets:
                yield ("edge", {
                    "source_id": entity_id,
                    "target_id": target,
                    "rel_type": "APPLIES_TO",
                    "props": {},
                })
            return

        node_props = self._flatten_properties(properties)
        yield ("node", {
            "label": label,
            "id": entity_id,
            "props": node_props,
        })

    def _flatten_properties(self, properties: dict[str, list[Any]]) -> dict[str, Any]:
        flat = {}
        for key, values in properties.items():
            if not values:
                continue
            if len(values) == 1:
                flat[key] = values[0]
            else:
                flat[key] = values
        return flat
