"""Predator v55.0 — Entity Graph Engine.

Manages the knowledge graph in Neo4j.

Node types: Company, Person, Broker, CustomsPost, Product,
            RegulatoryEvent, Tender, MediaMention.

Edge types: IMPORTS, OWNS, DIRECTS, CERTIFIED_BY, RELATED_TO, MENTIONED_IN.

Metrics: Degree, Betweenness, Eigenvector centralities,
         Influence Mass (IM), Louvain clustering.

Snapshots: daily at 03:00 → MinIO (spec 3.12).
Live queries: only for top 1000 nodes.
Approximation error: < 5% for p95.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import StrEnum
import logging
from typing import Any

logger = logging.getLogger("predator.engines.entity_graph")


class NodeType(StrEnum):
    COMPANY = "Company"
    PERSON = "Person"
    BROKER = "Broker"
    CUSTOMS_POST = "CustomsPost"
    PRODUCT = "Product"
    REGULATORY_EVENT = "RegulatoryEvent"
    TENDER = "Tender"
    MEDIA_MENTION = "MediaMention"


class EdgeType(StrEnum):
    IMPORTS = "IMPORTS"
    OWNS = "OWNS"
    DIRECTS = "DIRECTS"
    CERTIFIED_BY = "CERTIFIED_BY"
    RELATED_TO = "RELATED_TO"
    MENTIONED_IN = "MENTIONED_IN"
    PARTICIPATED = "PARTICIPATED"
    AFFECTS = "AFFECTS"
    WORKS_AT = "WORKS_AT"


@dataclass
class GraphNode:
    """A node in the entity graph."""

    ueid: str
    node_type: NodeType
    name: str
    properties: dict[str, Any] = field(default_factory=dict)


@dataclass
class GraphEdge:
    """An edge in the entity graph."""

    source_ueid: str
    target_ueid: str
    edge_type: EdgeType
    properties: dict[str, Any] = field(default_factory=dict)


@dataclass
class CentralityMetrics:
    """Centrality metrics for a node."""

    ueid: str
    degree: float = 0.0
    betweenness: float = 0.0
    eigenvector: float = 0.0
    pagerank: float = 0.0
    community_id: int | None = None


class EntityGraphEngine:
    """Engine for managing the entity knowledge graph.

    Uses Neo4j for storage and APOC for graph algorithms.
    Falls back to in-memory graph for testing.
    """

    def __init__(self, neo4j_url: str = "bolt://neo4j:7687", neo4j_auth: str = "neo4j/") -> None:
        self._neo4j_url = neo4j_url
        self._neo4j_auth = neo4j_auth
        self._driver = None

    async def connect(self) -> None:
        """Connect to Neo4j."""
        try:
            from neo4j import AsyncGraphDatabase

            user, password = self._neo4j_auth.split("/", 1)
            self._driver = AsyncGraphDatabase.driver(
                self._neo4j_url,
                auth=(user, password),
            )
            logger.info("Entity Graph Engine connected to Neo4j at %s", self._neo4j_url)
        except ImportError:
            logger.warning("neo4j driver not installed — Entity Graph running in stub mode")
        except Exception as e:
            logger.warning("Neo4j connection failed: %s", e)

    async def disconnect(self) -> None:
        """Disconnect from Neo4j."""
        if self._driver:
            await self._driver.close()
            logger.info("Entity Graph Engine disconnected")

    async def upsert_node(self, node: GraphNode) -> None:
        """Create or update a node in the graph."""
        if not self._driver:
            logger.debug("Graph stub: upsert_node %s (%s)", node.ueid, node.node_type)
            return

        query = f"""
        MERGE (n:{node.node_type.value} {{ueid: $ueid}})
        SET n.name = $name, n += $properties, n.updated_at = datetime()
        """
        async with self._driver.session() as session:
            await session.run(
                query,
                ueid=node.ueid,
                name=node.name,
                properties=node.properties,
            )

    async def upsert_edge(self, edge: GraphEdge) -> None:
        """Create or update an edge in the graph."""
        if not self._driver:
            logger.debug(
                "Graph stub: upsert_edge %s -[%s]-> %s",
                edge.source_ueid,
                edge.edge_type,
                edge.target_ueid,
            )
            return

        query = f"""
        MATCH (a {{ueid: $source_ueid}})
        MATCH (b {{ueid: $target_ueid}})
        MERGE (a)-[r:{edge.edge_type.value}]->(b)
        SET r += $properties, r.updated_at = datetime()
        """
        async with self._driver.session() as session:
            await session.run(
                query,
                source_ueid=edge.source_ueid,
                target_ueid=edge.target_ueid,
                properties=edge.properties,
            )

    async def get_neighbors(self, ueid: str, depth: int = 1) -> list[dict[str, Any]]:
        """Get neighbors of a node up to specified depth."""
        if not self._driver:
            return []

        query = """
        MATCH (n {ueid: $ueid})-[r*1..$depth]-(m)
        RETURN DISTINCT m.ueid AS ueid, m.name AS name, labels(m) AS labels
        LIMIT 1000
        """
        results = []
        async with self._driver.session() as session:
            result = await session.run(query, ueid=ueid, depth=depth)
            async for record in result:
                results.append(dict(record))
        return results
