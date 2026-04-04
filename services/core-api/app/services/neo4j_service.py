"""Neo4j Service — Інтеграція з графовою базою даних.

Функціонал:
- Підключення до Neo4j
- CRUD операції для вузлів та зв'язків
- Імпорт даних з реєстрів
- Граф-аналітика (shortest path, centrality, community detection)
"""
from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import StrEnum
import logging
import os
from typing import Any  # Додано Dict для більш точної типізації

from neo4j import AsyncDriver, AsyncGraphDatabase, AsyncSession
from neo4j.exceptions import AuthError, ServiceUnavailable

logger = logging.getLogger(__name__)


class NodeType(StrEnum):
    """Типи вузлів згідно STIX 2.1."""

    PERSON = "Person"
    ORGANIZATION = "Organization"
    LOCATION = "Location"
    INDICATOR = "Indicator"
    EVENT = "Event"
    DOCUMENT = "Document"
    INFRASTRUCTURE = "Infrastructure"
    ASSET = "Asset"


class RelationType(StrEnum):
    """Типи зв'язків."""

    OWNS = "OWNS"
    MANAGES = "MANAGES"
    FOUNDED = "FOUNDED"
    REGISTERED_AT = "REGISTERED_AT"
    LOCATED_AT = "LOCATED_AT"
    INVOLVED_IN = "INVOLVED_IN"
    RELATED_TO = "RELATED_TO"
    CONTROLS = "CONTROLS"
    HAS_INDICATOR = "HAS_INDICATOR"
    WORKS_AT = "WORKS_AT"
    CONNECTED_WITH = "CONNECTED_WITH"
    PARTICIPATED_IN = "PARTICIPATED_IN"
    DEBTOR_OF = "DEBTOR_OF"
    CREDITOR_OF = "CREDITOR_OF"


@dataclass
class GraphNode:
    """Вузол графа."""

    id: str
    type: NodeType
    name: str
    properties: dict[str, Any] = field(default_factory=dict)
    labels: list[str] = field(default_factory=list)


@dataclass
class GraphRelation:
    """Зв'язок між вузлами."""

    source_id: str
    target_id: str
    type: RelationType
    properties: dict[str, Any] = field(default_factory=dict)


@dataclass
class GraphResult:
    """Результат операції з графом."""

    success: bool
    nodes: list[dict] = field(default_factory=list)
    relations: list[dict] = field(default_factory=list)
    data: dict[str, Any] = field(default_factory=dict)
    errors: list[str] = field(default_factory=list)


class Neo4jService:
    """Сервіс для роботи з Neo4j."""

    def __init__(
        self,
        uri: str | None = None,
        username: str | None = None,
        password: str | None = None,
        database: str = "neo4j",
    ):
        self.uri = uri or os.getenv("NEO4J_URI", "bolt://localhost:7687")
        self.username = username or os.getenv("NEO4J_USERNAME", "neo4j")
        self.password = password or os.getenv("NEO4J_PASSWORD", "predator2026")
        self.database = database
        self._driver: AsyncDriver | None = None

    async def connect(self) -> bool:
        """Підключення до Neo4j."""
        try:
            self._driver = AsyncGraphDatabase.driver(
                self.uri,
                auth=(self.username, self.password),
            )
            # Перевірка з'єднання
            async with self._driver.session(database=self.database) as session:
                await session.run("RETURN 1")
            logger.info(f"Підключено до Neo4j: {self.uri}")
            return True
        except (ServiceUnavailable, AuthError) as e:
            logger.error(f"Помилка підключення до Neo4j: {e}")
            return False

    async def disconnect(self):
        """Закриття з'єднання."""
        if self._driver:
            await self._driver.close()
            self._driver = None
            logger.info("Відключено від Neo4j")

    async def _get_session(self) -> AsyncSession:
        """Отримати сесію."""
        if not self._driver:
            await self.connect()
        return self._driver.session(database=self.database)

    # ======================== SCHEMA ========================

    async def create_indexes(self) -> GraphResult:
        """Створення індексів для оптимізації."""
        queries = [
            # Індекси для вузлів
            "CREATE INDEX person_edrpou IF NOT EXISTS FOR (n:Person) ON (n.rnokpp)",
            "CREATE INDEX person_name IF NOT EXISTS FOR (n:Person) ON (n.name)",
            "CREATE INDEX org_edrpou IF NOT EXISTS FOR (n:Organization) ON (n.edrpou)",
            "CREATE INDEX org_name IF NOT EXISTS FOR (n:Organization) ON (n.name)",
            "CREATE INDEX location_address IF NOT EXISTS FOR (n:Location) ON (n.address)",
            "CREATE INDEX indicator_value IF NOT EXISTS FOR (n:Indicator) ON (n.value)",
            "CREATE INDEX event_date IF NOT EXISTS FOR (n:Event) ON (n.date)",
            # Constraint для унікальності
            "CREATE CONSTRAINT org_edrpou_unique IF NOT EXISTS FOR (n:Organization) REQUIRE n.edrpou IS UNIQUE",
            "CREATE CONSTRAINT person_rnokpp_unique IF NOT EXISTS FOR (n:Person) REQUIRE n.rnokpp IS UNIQUE",
        ]

        errors = []
        async with await self._get_session() as session:
            for query in queries:
                try:
                    await session.run(query)
                except Exception as e:
                    errors.append(f"{query}: {e!s}")

        return GraphResult(
            success=len(errors) == 0,
            data={"indexes_created": len(queries) - len(errors)},
            errors=errors,
        )

    # ======================== CRUD NODES ========================

    async def create_node(self, node: GraphNode) -> GraphResult:
        """Створення вузла."""
        labels = [node.type.value, *node.labels]
        labels_str = ":".join(labels)

        props: dict[str, Any] = {**node.properties, "name": node.name, "node_id": node.id} # Властивості словника можуть бути довільними
        props["created_at"] = datetime.now(UTC).isoformat()

        query = f"""
        MERGE (n:{labels_str} {{node_id: $node_id}})
        SET n += $props
        RETURN n
        """

        async with await self._get_session() as session:
            result = await session.run(query, node_id=node.id, props=props)
            record = await result.single()

            if record:
                return GraphResult(
                    success=True,
                    nodes=[dict(record["n"])],
                )

        return GraphResult(success=False, errors=["Не вдалося створити вузол"])

    async def get_node(self, node_id: str) -> GraphResult:
        """Отримати вузол за ID."""
        query = """
        MATCH (n {node_id: $node_id})
        RETURN n, labels(n) as labels
        """

        async with await self._get_session() as session:
            result = await session.run(query, node_id=node_id)
            record = await result.single()

            if record:
                node_data: dict[str, Any] = dict(record["n"]) # Властивості словника можуть бути довільними
                node_data["labels"] = record["labels"]
                return GraphResult(success=True, nodes=[node_data])

        return GraphResult(success=False, errors=["Вузол не знайдено"])

    async def search_nodes(
        self,
        node_type: NodeType | None = None,
        name: str | None = None,
        edrpou: str | None = None,
        limit: int = 50,
    ) -> GraphResult:
        """Пошук вузлів."""
        conditions = []
        params: dict[str, Any] = {"limit": limit} # Властивості словника можуть бути довільними

        label = node_type.value if node_type else ""

        if name:
            conditions.append("n.name CONTAINS $name")
            params["name"] = name

        if edrpou:
            conditions.append("n.edrpou = $edrpou")
            params["edrpou"] = edrpou

        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

        query = f"""
        MATCH (n{':' + label if label else ''})
        {where_clause}
        RETURN n, labels(n) as labels
        LIMIT $limit
        """

        nodes = []
        async with await self._get_session() as session:
            result = await session.run(query, **params)
            async for record in result:
                node_data = dict(record["n"])
                node_data["labels"] = record["labels"]
                nodes.append(node_data)

        return GraphResult(success=True, nodes=nodes, data={"total": len(nodes)})

    # ======================== CRUD RELATIONS ========================

    async def create_relation(self, relation: GraphRelation) -> GraphResult:
        """Створення зв'язку."""
        props = {**relation.properties}
        props["created_at"] = datetime.now(UTC).isoformat()

        query = f"""
        MATCH (a {{node_id: $source_id}})
        MATCH (b {{node_id: $target_id}})
        MERGE (a)-[r:{relation.type.value}]->(b)
        SET r += $props
        RETURN a, r, b
        """

        async with await self._get_session() as session:
            result = await session.run(
                query,
                source_id=relation.source_id,
                target_id=relation.target_id,
                props=props,
            )
            record = await result.single()

            if record:
                return GraphResult(
                    success=True,
                    relations=[{
                        "source": dict(record["a"]),
                        "relation": dict(record["r"]),
                        "target": dict(record["b"]),
                    }],
                )

        return GraphResult(success=False, errors=["Не вдалося створити зв'язок"])

    # ======================== GRAPH ANALYTICS ========================

    async def get_subgraph(
        self,
        center_node_id: str,
        depth: int = 2,
        limit: int = 100,
    ) -> GraphResult:
        """Отримати підграф навколо вузла."""
        query = """
        MATCH path = (center {node_id: $node_id})-[*1..$depth]-(connected)
        WITH center, connected, relationships(path) as rels
        UNWIND rels as rel
        WITH center, connected, rel, startNode(rel) as source, endNode(rel) as target
        RETURN DISTINCT
            center,
            connected,
            type(rel) as rel_type,
            source.node_id as source_id,
            target.node_id as target_id
        LIMIT $limit
        """

        nodes = {}
        relations = []

        async with await self._get_session() as session:
            result = await session.run(
                query,
                node_id=center_node_id,
                depth=depth,
                limit=limit,
            )

            async for record in result:
                # Центральний вузол
                center = dict(record["center"])
                nodes[center.get("node_id")] = center

                # Пов'язаний вузол
                connected = dict(record["connected"])
                nodes[connected.get("node_id")] = connected

                # Зв'язок
                relations.append({
                    "source_id": record["source_id"],
                    "target_id": record["target_id"],
                    "type": record["rel_type"],
                })

        return GraphResult(
            success=True,
            nodes=list(nodes.values()),
            relations=relations,
            data={
                "center_node": center_node_id,
                "depth": depth,
                "nodes_count": len(nodes),
                "relations_count": len(relations),
            },
        )

    async def find_shortest_path(
        self,
        source_id: str,
        target_id: str,
        max_depth: int = 10,
    ) -> GraphResult:
        """Знайти найкоротший шлях між двома вузлами."""
        query = """
        MATCH path = shortestPath(
            (a {node_id: $source_id})-[*1..$max_depth]-(b {node_id: $target_id})
        )
        RETURN path, length(path) as path_length
        """

        async with await self._get_session() as session:
            result = await session.run(
                query,
                source_id=source_id,
                target_id=target_id,
                max_depth=max_depth,
            )
            record = await result.single()

            if record:
                path = record["path"]
                nodes = [dict(node) for node in path.nodes]
                relations = [
                    {
                        "type": rel.type,
                        "source_id": rel.start_node.get("node_id"),
                        "target_id": rel.end_node.get("node_id"),
                    }
                    for rel in path.relationships
                ]

                return GraphResult(
                    success=True,
                    nodes=nodes,
                    relations=relations,
                    data={
                        "path_length": record["path_length"],
                        "source_id": source_id,
                        "target_id": target_id,
                    },
                )

        return GraphResult(
            success=False,
            errors=["Шлях не знайдено"],
            data={"source_id": source_id, "target_id": target_id},
        )

    async def get_node_centrality(self, node_id: str) -> GraphResult:
        """Обчислити централність вузла."""
        query = """
        MATCH (n {node_id: $node_id})
        OPTIONAL MATCH (n)-[r]-()
        WITH n, count(r) as degree
        OPTIONAL MATCH (n)-[]->(out)
        WITH n, degree, count(out) as out_degree
        OPTIONAL MATCH (n)<-[]-(in)
        RETURN n, degree, out_degree, count(in) as in_degree
        """

        async with await self._get_session() as session:
            result = await session.run(query, node_id=node_id)
            record = await result.single()

            if record:
                return GraphResult(
                    success=True,
                    nodes=[dict(record["n"])],
                    data={
                        "degree_centrality": record["degree"],
                        "out_degree": record["out_degree"],
                        "in_degree": record["in_degree"],
                    },
                )

        return GraphResult(success=False, errors=["Вузол не знайдено"])

    async def find_communities(self, min_size: int = 3) -> GraphResult:
        """Виявлення спільнот (community detection)."""
        # Використовуємо Label Propagation
        query = """
        CALL gds.labelPropagation.stream({
            nodeProjection: '*',
            relationshipProjection: '*'
        })
        YIELD nodeId, communityId
        WITH communityId, collect(gds.util.asNode(nodeId)) as members
        WHERE size(members) >= $min_size
        RETURN communityId,
               size(members) as size,
               [m in members | m.name] as member_names
        ORDER BY size DESC
        LIMIT 20
        """

        communities = []
        try:
            async with await self._get_session() as session:
                result = await session.run(query, min_size=min_size)
                async for record in result:
                    communities.append({
                        "community_id": record["communityId"],
                        "size": record["size"],
                        "members": record["member_names"],
                    })
        except Exception as e:
            # GDS може бути не встановлений
            logger.warning(f"GDS не доступний: {e}")
            return GraphResult(
                success=False,
                errors=["Neo4j GDS не встановлено. Використовуйте базову версію."],
            )

        return GraphResult(
            success=True,
            data={
                "communities_found": len(communities),
                "communities": communities,
            },
        )

    # ======================== IMPORT DATA ========================

    async def import_company(
        self,
        edrpou: str,
        name: str,
        status: str | None = None,
        address: str | None = None,
        kved: str | None = None,
        founders: list[dict[str, Any]] | None = None, # Властивості словника можуть бути довільними
        managers: list[dict[str, Any]] | None = None, # Властивості словника можуть бути довільними
        beneficiaries: list[dict[str, Any]] | None = None, # Властивості словника можуть бути довільними
    ) -> GraphResult:
        """Імпорт компанії з ЄДР."""
        # Створюємо вузол компанії
        org_node = GraphNode(
            id=f"org_{edrpou}",
            type=NodeType.ORGANIZATION,
            name=name,
            properties={
                "edrpou": edrpou,
                "status": status,
                "kved": kved,
                "source": "edr",
            },
        )
        await self.create_node(org_node)

        # Адреса
        if address:
            loc_node = GraphNode(
                id=f"loc_{hash(address)}",
                type=NodeType.LOCATION,
                name=address,
                properties={"address": address, "type": "legal_address"},
            )
            await self.create_node(loc_node)
            await self.create_relation(GraphRelation(
                source_id=org_node.id,
                target_id=loc_node.id,
                type=RelationType.REGISTERED_AT,
            ))

        # Засновники
        if founders:
            for founder in founders:
                founder_id = founder.get("rnokpp") or founder.get("edrpou") or hash(founder.get("name", ""))

                if founder.get("edrpou"):
                    # Юридична особа-засновник
                    founder_node = GraphNode(
                        id=f"org_{founder.get('edrpou')}",
                        type=NodeType.ORGANIZATION,
                        name=founder.get("name", ""),
                        properties={"edrpou": founder.get("edrpou")},
                    )
                else:
                    # Фізична особа-засновник
                    founder_node = GraphNode(
                        id=f"person_{founder_id}",
                        type=NodeType.PERSON,
                        name=founder.get("name", ""),
                        properties={
                            "rnokpp": founder.get("rnokpp"),
                            "share": founder.get("share"),
                        },
                    )

                await self.create_node(founder_node)
                await self.create_relation(GraphRelation(
                    source_id=founder_node.id,
                    target_id=org_node.id,
                    type=RelationType.FOUNDED,
                    properties={"share": founder.get("share")},
                ))

        # Керівники
        if managers:
            for manager in managers:
                manager_id = manager.get("rnokpp") or hash(manager.get("name", ""))
                manager_node = GraphNode(
                    id=f"person_{manager_id}",
                    type=NodeType.PERSON,
                    name=manager.get("name", ""),
                    properties={
                        "rnokpp": manager.get("rnokpp"),
                        "position": manager.get("position"),
                    },
                )
                await self.create_node(manager_node)
                await self.create_relation(GraphRelation(
                    source_id=manager_node.id,
                    target_id=org_node.id,
                    type=RelationType.MANAGES,
                    properties={"position": manager.get("position")},
                ))

        # Бенефіціари
        if beneficiaries:
            for beneficiary in beneficiaries:
                ben_id = beneficiary.get("rnokpp") or hash(beneficiary.get("name", ""))
                ben_node = GraphNode(
                    id=f"person_{ben_id}",
                    type=NodeType.PERSON,
                    name=beneficiary.get("name", ""),
                    properties={
                        "rnokpp": beneficiary.get("rnokpp"),
                        "ownership_percentage": beneficiary.get("ownership_percentage"),
                    },
                )
                await self.create_node(ben_node)
                await self.create_relation(GraphRelation(
                    source_id=ben_node.id,
                    target_id=org_node.id,
                    type=RelationType.CONTROLS,
                    properties={"ownership_percentage": beneficiary.get("ownership_percentage")},
                ))

        return GraphResult(
            success=True,
            data={
                "edrpou": edrpou,
                "name": name,
                "founders_count": len(founders) if founders else 0,
                "managers_count": len(managers) if managers else 0,
                "beneficiaries_count": len(beneficiaries) if beneficiaries else 0,
            },
        )

    async def import_court_case(
        self,
        case_number: str,
        court: str,
        date: str,
        parties: list[dict[str, Any]], # Властивості словника можуть бути довільними
        decision: str | None = None,
    ) -> GraphResult:
        """Імпорт судової справи."""
        # Створюємо вузол справи
        case_node = GraphNode(
            id=f"case_{hash(case_number)}",
            type=NodeType.EVENT,
            name=f"Справа {case_number}",
            properties={
                "case_number": case_number,
                "court": court,
                "date": date,
                "decision": decision,
                "source": "court_registry",
            },
            labels=["CourtCase"],
        )
        await self.create_node(case_node)

        # Сторони справи
        for party in parties:
            party_id = party.get("edrpou") or party.get("rnokpp") or hash(party.get("name", ""))

            if party.get("edrpou"):
                party_node = GraphNode(
                    id=f"org_{party.get('edrpou')}",
                    type=NodeType.ORGANIZATION,
                    name=party.get("name", ""),
                    properties={"edrpou": party.get("edrpou")},
                )
            else:
                party_node = GraphNode(
                    id=f"person_{party_id}",
                    type=NodeType.PERSON,
                    name=party.get("name", ""),
                    properties={"rnokpp": party.get("rnokpp")},
                )

            await self.create_node(party_node)
            await self.create_relation(GraphRelation(
                source_id=party_node.id,
                target_id=case_node.id,
                type=RelationType.INVOLVED_IN,
                properties={"role": party.get("role")},  # plaintiff, defendant, third_party
            ))

        return GraphResult(
            success=True,
            data={
                "case_number": case_number,
                "parties_count": len(parties),
            },
        )

    async def import_tender(
        self,
        tender_id: str,
        title: str,
        procuring_entity: dict[str, Any], # Властивості словника можуть бути довільними
        participants: list[dict[str, Any]], # Властивості словника можуть бути довільними
        winner: dict[str, Any] | None = None, # Властивості словника можуть бути довільними
        amount: float | None = None,
    ) -> GraphResult:
        """Імпорт тендера з Prozorro."""
        # Вузол тендера
        tender_node = GraphNode(
            id=f"tender_{tender_id}",
            type=NodeType.EVENT,
            name=title,
            properties={
                "tender_id": tender_id,
                "amount": amount,
                "source": "prozorro",
            },
            labels=["Tender"],
        )
        await self.create_node(tender_node)

        # Замовник
        if procuring_entity:
            pe_node = GraphNode(
                id=f"org_{procuring_entity.get('edrpou')}",
                type=NodeType.ORGANIZATION,
                name=procuring_entity.get("name", ""),
                properties={"edrpou": procuring_entity.get("edrpou")},
            )
            await self.create_node(pe_node)
            await self.create_relation(GraphRelation(
                source_id=pe_node.id,
                target_id=tender_node.id,
                type=RelationType.INVOLVED_IN,
                properties={"role": "procuring_entity"},
            ))

        # Учасники
        for participant in participants:
            part_node = GraphNode(
                id=f"org_{participant.get('edrpou')}",
                type=NodeType.ORGANIZATION,
                name=participant.get("name", ""),
                properties={"edrpou": participant.get("edrpou")},
            )
            await self.create_node(part_node)

            is_winner = winner and participant.get("edrpou") == winner.get("edrpou")
            await self.create_relation(GraphRelation(
                source_id=part_node.id,
                target_id=tender_node.id,
                type=RelationType.PARTICIPATED_IN,
                properties={
                    "role": "winner" if is_winner else "participant",
                    "bid_amount": participant.get("bid_amount"),
                },
            ))

        return GraphResult(
            success=True,
            data={
                "tender_id": tender_id,
                "participants_count": len(participants),
            },
        )

    # ======================== STATISTICS ========================

    async def get_statistics(self) -> GraphResult:
        """Статистика графа."""
        query = """
        MATCH (n)
        WITH labels(n) as labels, count(*) as count
        UNWIND labels as label
        RETURN label, sum(count) as node_count
        ORDER BY node_count DESC
        """

        rel_query = """
        MATCH ()-[r]->()
        RETURN type(r) as rel_type, count(*) as rel_count
        ORDER BY rel_count DESC
        """

        node_stats = {}
        rel_stats = {}

        async with await self._get_session() as session:
            # Статистика вузлів
            result = await session.run(query)
            async for record in result:
                node_stats[record["label"]] = record["node_count"]

            # Статистика зв'язків
            result = await session.run(rel_query)
            async for record in result:
                rel_stats[record["rel_type"]] = record["rel_count"]

        return GraphResult(
            success=True,
            data={
                "nodes": node_stats,
                "relations": rel_stats,
                "total_nodes": sum(node_stats.values()),
                "total_relations": sum(rel_stats.values()),
            },
        )
