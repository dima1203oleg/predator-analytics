"""Knowledge Graph — STIX 2.1 онтологія та NLP pipeline.

Компоненти:
- STIXGraphBuilder: Побудова графа згідно STIX 2.1
- NLPEntityExtractor: NER, Coreference Resolution, Relationship Extraction
- GraphQueryEngine: Cypher/TypeDB запити
"""
import logging
import uuid
from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import StrEnum
from typing import Any

logger = logging.getLogger(__name__)


# ======================== STIX 2.1 ТИПИ ========================


class STIXNodeType(StrEnum):
    """Типи вузлів згідно STIX 2.1."""
    THREAT_ACTOR = "threat-actor"  # Особа, група, компанія
    CAMPAIGN = "campaign"  # Серія пов'язаних дій
    INDICATOR = "indicator"  # IoC: email, телефон, IP, домен
    MALWARE = "malware"  # Шкідливе ПЗ
    VULNERABILITY = "vulnerability"  # Вразливості
    INFRASTRUCTURE = "infrastructure"  # Сервери, хостинг
    LOCATION = "location"  # Геолокація
    IDENTITY = "identity"  # Ідентичність (компанія, особа)
    TOOL = "tool"  # Інструменти
    ATTACK_PATTERN = "attack-pattern"  # Патерни атак
    INTRUSION_SET = "intrusion-set"  # Набір вторгнень
    OBSERVED_DATA = "observed-data"  # Спостережувані дані


class STIXRelationType(StrEnum):
    """Типи зв'язків згідно STIX 2.1."""
    USES = "uses"  # Threat-Actor використовує Malware/Infrastructure
    TARGETS = "targets"  # Campaign націлена на Identity
    INDICATES = "indicates"  # Indicator вказує на Campaign
    ATTRIBUTED_TO = "attributed-to"  # Campaign приписується Threat-Actor
    EXPLOITS = "exploits"  # Malware експлуатує Vulnerability
    LOCATED_AT = "located-at"  # Identity знаходиться в Location
    OWNS = "owns"  # Identity володіє Infrastructure
    RELATED_TO = "related-to"  # Загальний зв'язок
    DERIVED_FROM = "derived-from"  # Походить від
    DUPLICATE_OF = "duplicate-of"  # Дублікат
    CONTROLS = "controls"  # Контролює
    COMMUNICATES_WITH = "communicates-with"  # Комунікує з


@dataclass
class STIXNode:
    """Вузол графа STIX."""
    id: str
    type: STIXNodeType
    name: str
    properties: dict[str, Any] = field(default_factory=dict)
    created: datetime = field(default_factory=lambda: datetime.now(UTC))
    modified: datetime = field(default_factory=lambda: datetime.now(UTC))
    confidence: float = 1.0  # 0.0 - 1.0
    source: str = ""


@dataclass
class STIXRelation:
    """Зв'язок між вузлами STIX."""
    id: str
    type: STIXRelationType
    source_id: str
    target_id: str
    properties: dict[str, Any] = field(default_factory=dict)
    confidence: float = 1.0
    created: datetime = field(default_factory=lambda: datetime.now(UTC))


@dataclass
class GraphResult:
    """Результат операції з графом."""
    success: bool
    nodes: list[STIXNode] = field(default_factory=list)
    relations: list[STIXRelation] = field(default_factory=list)
    data: dict[str, Any] = field(default_factory=dict)
    errors: list[str] = field(default_factory=list)


class STIXGraphBuilder:
    """Побудова Knowledge Graph згідно STIX 2.1.

    Використовується для:
    - Створення сутностей (Threat-Actor, Campaign, Indicator)
    - Встановлення зв'язків між сутностями
    - Аналізу патернів та аномалій
    """

    def __init__(self):
        self.nodes: dict[str, STIXNode] = {}
        self.relations: list[STIXRelation] = []

    def _generate_id(self, node_type: STIXNodeType) -> str:
        """Генерація STIX ID."""
        return f"{node_type.value}--{uuid.uuid4()}"

    def add_threat_actor(
        self,
        name: str,
        actor_type: str = "individual",  # individual, group, organization
        aliases: list[str] | None = None,
        goals: list[str] | None = None,
        sophistication: str = "minimal",
        resource_level: str = "individual",
        primary_motivation: str = "personal-gain",
        **properties,
    ) -> STIXNode:
        """Додати Threat Actor (особа, група, компанія)."""
        node_id = self._generate_id(STIXNodeType.THREAT_ACTOR)

        node = STIXNode(
            id=node_id,
            type=STIXNodeType.THREAT_ACTOR,
            name=name,
            properties={
                "threat_actor_types": [actor_type],
                "aliases": aliases or [],
                "goals": goals or [],
                "sophistication": sophistication,
                "resource_level": resource_level,
                "primary_motivation": primary_motivation,
                **properties,
            },
        )

        self.nodes[node_id] = node
        return node

    def add_identity(
        self,
        name: str,
        identity_class: str = "organization",  # individual, group, organization
        sectors: list[str] | None = None,
        contact_information: str | None = None,
        edrpou: str | None = None,
        **properties,
    ) -> STIXNode:
        """Додати Identity (компанія, особа)."""
        node_id = self._generate_id(STIXNodeType.IDENTITY)

        node = STIXNode(
            id=node_id,
            type=STIXNodeType.IDENTITY,
            name=name,
            properties={
                "identity_class": identity_class,
                "sectors": sectors or [],
                "contact_information": contact_information,
                "edrpou": edrpou,
                **properties,
            },
        )

        self.nodes[node_id] = node
        return node

    def add_campaign(
        self,
        name: str,
        description: str = "",
        objective: str = "",
        first_seen: datetime | None = None,
        last_seen: datetime | None = None,
        **properties,
    ) -> STIXNode:
        """Додати Campaign (серія пов'язаних дій)."""
        node_id = self._generate_id(STIXNodeType.CAMPAIGN)

        node = STIXNode(
            id=node_id,
            type=STIXNodeType.CAMPAIGN,
            name=name,
            properties={
                "description": description,
                "objective": objective,
                "first_seen": first_seen.isoformat() if first_seen else None,
                "last_seen": last_seen.isoformat() if last_seen else None,
                **properties,
            },
        )

        self.nodes[node_id] = node
        return node

    def add_indicator(
        self,
        name: str,
        indicator_type: str,  # email, phone, ip, domain, hash
        pattern: str,
        valid_from: datetime | None = None,
        valid_until: datetime | None = None,
        **properties,
    ) -> STIXNode:
        """Додати Indicator (IoC)."""
        node_id = self._generate_id(STIXNodeType.INDICATOR)

        node = STIXNode(
            id=node_id,
            type=STIXNodeType.INDICATOR,
            name=name,
            properties={
                "indicator_types": [indicator_type],
                "pattern": pattern,
                "pattern_type": "stix",
                "valid_from": valid_from.isoformat() if valid_from else datetime.now(UTC).isoformat(),
                "valid_until": valid_until.isoformat() if valid_until else None,
                **properties,
            },
        )

        self.nodes[node_id] = node
        return node

    def add_infrastructure(
        self,
        name: str,
        infrastructure_types: list[str] | None = None,
        description: str = "",
        **properties,
    ) -> STIXNode:
        """Додати Infrastructure (сервери, хостинг)."""
        node_id = self._generate_id(STIXNodeType.INFRASTRUCTURE)

        node = STIXNode(
            id=node_id,
            type=STIXNodeType.INFRASTRUCTURE,
            name=name,
            properties={
                "infrastructure_types": infrastructure_types or ["unknown"],
                "description": description,
                **properties,
            },
        )

        self.nodes[node_id] = node
        return node

    def add_location(
        self,
        name: str,
        country: str | None = None,
        city: str | None = None,
        latitude: float | None = None,
        longitude: float | None = None,
        **properties,
    ) -> STIXNode:
        """Додати Location (геолокація)."""
        node_id = self._generate_id(STIXNodeType.LOCATION)

        node = STIXNode(
            id=node_id,
            type=STIXNodeType.LOCATION,
            name=name,
            properties={
                "country": country,
                "city": city,
                "latitude": latitude,
                "longitude": longitude,
                **properties,
            },
        )

        self.nodes[node_id] = node
        return node

    def add_relation(
        self,
        source_id: str,
        target_id: str,
        relation_type: STIXRelationType,
        confidence: float = 1.0,
        **properties,
    ) -> STIXRelation:
        """Додати зв'язок між вузлами."""
        relation_id = f"relationship--{uuid.uuid4()}"

        relation = STIXRelation(
            id=relation_id,
            type=relation_type,
            source_id=source_id,
            target_id=target_id,
            confidence=confidence,
            properties=properties,
        )

        self.relations.append(relation)
        return relation

    def get_subgraph(
        self,
        center_node_id: str,
        depth: int = 2,
    ) -> GraphResult:
        """Отримати підграф навколо вузла."""
        visited_nodes = set()
        result_nodes = []
        result_relations = []

        def traverse(node_id: str, current_depth: int):
            if current_depth > depth or node_id in visited_nodes:
                return

            visited_nodes.add(node_id)

            if node_id in self.nodes:
                result_nodes.append(self.nodes[node_id])

            for relation in self.relations:
                if relation.source_id == node_id:
                    result_relations.append(relation)
                    traverse(relation.target_id, current_depth + 1)
                elif relation.target_id == node_id:
                    result_relations.append(relation)
                    traverse(relation.source_id, current_depth + 1)

        traverse(center_node_id, 0)

        return GraphResult(
            success=True,
            nodes=result_nodes,
            relations=result_relations,
            data={
                "center_node": center_node_id,
                "depth": depth,
                "nodes_count": len(result_nodes),
                "relations_count": len(result_relations),
            },
        )

    def export_to_neo4j_cypher(self) -> str:
        """Експорт графа у Cypher для Neo4j."""
        cypher_statements = []

        # Створення вузлів
        for node in self.nodes.values():
            props = {**node.properties, "name": node.name, "stix_id": node.id}
            props_str = ", ".join(f"{k}: ${k}" for k in props)
            cypher_statements.append(
                f"CREATE (n:{node.type.value.replace('-', '_')} {{{props_str}}})"
            )

        # Створення зв'язків
        for relation in self.relations:
            cypher_statements.append(
                f"MATCH (a {{stix_id: '{relation.source_id}'}}), (b {{stix_id: '{relation.target_id}'}}) "
                f"CREATE (a)-[:{relation.type.value.upper().replace('-', '_')}]->(b)"
            )

        return "\n".join(cypher_statements)


class NLPEntityExtractor:
    """NLP Pipeline для автоматичного наповнення графа.

    Компоненти:
    - Entity Extraction (NER): Витягування назв компаній, ПІБ, адрес
    - Coreference Resolution: "Петров", "він", "директор" = одна сутність
    - Relationship Extraction: "Компанія А подала позов до Компанії Б"
    """

    # Типи сутностей для NER
    ENTITY_TYPES = {
        "PERSON": STIXNodeType.IDENTITY,
        "ORG": STIXNodeType.IDENTITY,
        "GPE": STIXNodeType.LOCATION,  # Geo-Political Entity
        "LOC": STIXNodeType.LOCATION,
        "MONEY": STIXNodeType.OBSERVED_DATA,
        "DATE": STIXNodeType.OBSERVED_DATA,
        "EMAIL": STIXNodeType.INDICATOR,
        "PHONE": STIXNodeType.INDICATOR,
        "EDRPOU": STIXNodeType.INDICATOR,
    }

    # Патерни для relationship extraction
    RELATION_PATTERNS = [
        {"pattern": "подав позов до", "relation": STIXRelationType.TARGETS},
        {"pattern": "є директором", "relation": STIXRelationType.CONTROLS},
        {"pattern": "є засновником", "relation": STIXRelationType.OWNS},
        {"pattern": "є бенефіціаром", "relation": STIXRelationType.CONTROLS},
        {"pattern": "пов'язаний з", "relation": STIXRelationType.RELATED_TO},
        {"pattern": "працює в", "relation": STIXRelationType.RELATED_TO},
        {"pattern": "володіє", "relation": STIXRelationType.OWNS},
        {"pattern": "контролює", "relation": STIXRelationType.CONTROLS},
    ]

    async def extract_entities(self, text: str) -> GraphResult:
        """Витягування сутностей з тексту."""
        # Симуляція NER
        entities = [
            {"text": "ТОВ «Компанія А»", "type": "ORG", "start": 0, "end": 15},
            {"text": "Іванов Іван Іванович", "type": "PERSON", "start": 20, "end": 40},
            {"text": "12345678", "type": "EDRPOU", "start": 50, "end": 58},
            {"text": "м. Київ", "type": "GPE", "start": 60, "end": 67},
            {"text": "1 000 000 грн", "type": "MONEY", "start": 70, "end": 83},
        ]

        nodes = []
        for entity in entities:
            node_type = self.ENTITY_TYPES.get(entity["type"], STIXNodeType.OBSERVED_DATA)
            nodes.append(STIXNode(
                id=f"{node_type.value}--{uuid.uuid4()}",
                type=node_type,
                name=entity["text"],
                properties={
                    "entity_type": entity["type"],
                    "source_text_position": {"start": entity["start"], "end": entity["end"]},
                },
            ))

        return GraphResult(
            success=True,
            nodes=nodes,
            data={
                "text_length": len(text),
                "entities_found": len(entities),
                "entity_types": list({e["type"] for e in entities}),
            },
        )

    async def extract_relations(self, text: str) -> GraphResult:
        """Витягування зв'язків з тексту."""
        # Симуляція relationship extraction
        relations = [
            {
                "subject": "ТОВ «Компанія А»",
                "predicate": "подав позов до",
                "object": "ТОВ «Компанія Б»",
                "relation_type": STIXRelationType.TARGETS,
            },
            {
                "subject": "Іванов Іван Іванович",
                "predicate": "є директором",
                "object": "ТОВ «Компанія А»",
                "relation_type": STIXRelationType.CONTROLS,
            },
        ]

        stix_relations = []
        for rel in relations:
            stix_relations.append(STIXRelation(
                id=f"relationship--{uuid.uuid4()}",
                type=rel["relation_type"],
                source_id=f"placeholder-{rel['subject']}",
                target_id=f"placeholder-{rel['object']}",
                properties={
                    "predicate_text": rel["predicate"],
                },
            ))

        return GraphResult(
            success=True,
            relations=stix_relations,
            data={
                "relations_found": len(relations),
                "relation_types": list({r["relation_type"].value for r in relations}),
            },
        )

    async def process_document(self, text: str) -> GraphResult:
        """Повна обробка документа."""
        entities_result = await self.extract_entities(text)
        relations_result = await self.extract_relations(text)

        return GraphResult(
            success=True,
            nodes=entities_result.nodes,
            relations=relations_result.relations,
            data={
                "entities": entities_result.data,
                "relations": relations_result.data,
            },
        )


class GraphQueryEngine:
    """Движок запитів до Knowledge Graph.

    Підтримує:
    - Cypher (Neo4j)
    - TypeQL (TypeDB)
    - Natural Language (через LLM)
    """

    def __init__(self, graph_builder: STIXGraphBuilder | None = None):
        self.graph = graph_builder or STIXGraphBuilder()

    async def query_cypher(self, query: str) -> GraphResult:
        """Виконання Cypher запиту."""
        # Симуляція виконання запиту
        return GraphResult(
            success=True,
            data={
                "query": query,
                "result": "Query executed successfully",
                "rows_affected": 0,
            },
        )

    async def find_connections(
        self,
        entity1_name: str,
        entity2_name: str,
        max_depth: int = 3,
    ) -> GraphResult:
        """Пошук зв'язків між двома сутностями."""
        # Симуляція пошуку шляхів
        paths = [
            {
                "path": [entity1_name, "ТОВ «Посередник»", entity2_name],
                "relations": ["OWNS", "RELATED_TO"],
                "depth": 2,
            },
        ]

        return GraphResult(
            success=True,
            data={
                "entity1": entity1_name,
                "entity2": entity2_name,
                "paths_found": len(paths),
                "paths": paths,
                "shortest_path_length": min(p["depth"] for p in paths) if paths else None,
            },
        )

    async def find_anomalies(self) -> GraphResult:
        """Пошук аномалій у графі."""
        anomalies = [
            {
                "type": "circular_ownership",
                "description": "Циклічне володіння: A -> B -> C -> A",
                "entities": ["Компанія А", "Компанія Б", "Компанія В"],
                "severity": "high",
            },
            {
                "type": "hidden_beneficiary",
                "description": "Прихований бенефіціар через ланцюг компаній",
                "entities": ["Особа X", "Компанія 1", "Компанія 2"],
                "severity": "medium",
            },
        ]

        return GraphResult(
            success=True,
            data={
                "anomalies_found": len(anomalies),
                "anomalies": anomalies,
                "by_severity": {
                    "high": len([a for a in anomalies if a["severity"] == "high"]),
                    "medium": len([a for a in anomalies if a["severity"] == "medium"]),
                    "low": len([a for a in anomalies if a["severity"] == "low"]),
                },
            },
        )
