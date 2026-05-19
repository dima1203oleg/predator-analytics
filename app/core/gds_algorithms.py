"""Neo4j GDS Graph Algorithms v63.0-ELITE.

Алгоритми для виявлення фрод-схем та аналізу зв'язків:
  - Louvain community detection → кластери фрод-схем
  - PageRank → топ-100 ризикових компаній
  - Node2Vec embeddings → "схожі компанії" через Qdrant
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Any

from app.core.settings import get_settings

if TYPE_CHECKING:
    from collections.abc import Sequence

settings = get_settings()
logger = logging.getLogger(__name__)


@dataclass
class CommunityResult:
    """Результат community detection."""

    community_id: int
    size: int
    members: list[dict[str, Any]]
    avg_risk_score: float
    dominant_country: str | None = None
    description: str = ""


@dataclass
class PageRankResult:
    """Результат PageRank."""

    company_id: str
    company_name: str
    pagerank: float
    risk_score: float
    connections: int


@dataclass
class SimilarCompany:
    """Схожа компанія (Node2Vec)."""

    company_id: str
    company_name: str
    similarity: float
    shared_connections: int


# ── GDS Client ───────────────────────────────────────────────


class Neo4jGDSClient:
    """Клієнт для Neo4j Graph Data Science алгоритмів."""

    def __init__(self, driver: Any) -> None:
        self._driver = driver

    async def _run(self, query: str, **params: Any) -> list[dict[str, Any]]:
        """Виконує Cypher запит."""
        async with self._driver.session() as session:
            result = await session.run(query, **params)
            records = await result.data()
            return records

    # ── Louvain Community Detection ──────────────────────────

    async def detect_communities(
        self, min_community_size: int = 3
    ) -> list[CommunityResult]:
        """Виявляє кластери компаній через Louvain алгоритм."""
        query = """
        CALL gds.louvain.stream('company_graph', {
            relationshipWeightProperty: 'transaction_count',
            minCommunitySize: $min_size,
            includeIntermediateCommunities: false
        })
        YIELD nodeId, communityId, intermediateCommunityIds
        WITH gds.util.asNode(nodeId) AS company, communityId
        RETURN communityId AS community_id,
               count(*) AS size,
               collect({
                   id: company.id,
                   name: company.name,
                   country: company.country,
                   risk_score: company.risk_score
               }) AS members,
               avg(company.risk_score) AS avg_risk_score
        ORDER BY size DESC
        LIMIT 20
        """
        records = await self._run(query, min_size=min_community_size)

        results = []
        for r in records:
            countries = [m["country"] for m in r["members"] if m.get("country")]
            dominant = max(set(countries), key=countries.count) if countries else None

            results.append(CommunityResult(
                community_id=r["community_id"],
                size=r["size"],
                members=r["members"],
                avg_risk_score=round(r["avg_risk_score"], 4),
                dominant_country=dominant,
                description=f"Кластер з {r['size']} компаній, середній ризик {r['avg_risk_score']:.2f}",
            ))

        return results

    # ── PageRank ─────────────────────────────────────────────

    async def compute_pagerank(self, top_n: int = 100) -> list[PageRankResult]:
        """Обчислює PageRank для виявлення ключових компаній."""
        query = """
        CALL gds.pageRank.stream('company_graph', {
            maxIterations: 20,
            dampingFactor: 0.85,
            relationshipWeightProperty: 'transaction_count'
        })
        YIELD nodeId, score
        WITH gds.util.asNode(nodeId) AS company, score
        RETURN company.id AS company_id,
               company.name AS company_name,
               score AS pagerank,
               company.risk_score AS risk_score,
               size((company)-[:CONNECTED_TO]-()) AS connections
        ORDER BY score DESC
        LIMIT $top_n
        """
        records = await self._run(query, top_n=top_n)

        return [
            PageRankResult(
                company_id=r["company_id"],
                company_name=r["company_name"],
                pagerank=round(r["pagerank"], 6),
                risk_score=round(r.get("risk_score", 0), 4),
                connections=r.get("connections", 0),
            )
            for r in records
        ]

    # ── Node2Vec ─────────────────────────────────────────────

    async def compute_node2vec(
        self, embedding_dim: int = 128
    ) -> dict[str, list[float]]:
        """Обчислює Node2Vec embeddings для всіх компаній."""
        query = """
        CALL gds.node2vec.stream('company_graph', {
            embeddingDimension: $dim,
            walkLength: 20,
            walksPerNode: 10,
            p: 1.0,
            q: 1.0
        })
        YIELD nodeId, embedding
        RETURN gds.util.asNode(nodeId).id AS company_id, embedding
        """
        records = await self._run(query, dim=embedding_dim)

        return {r["company_id"]: list(r["embedding"]) for r in records}

    async def find_similar_companies(
        self, company_id: str, top_n: int = 10
    ) -> list[SimilarCompany]:
        """Знаходить схожі компанії через Node2Vec cosine similarity."""
        query = """
        MATCH (c:Company {id: $company_id})
        CALL gds.node2vec.stream('company_graph', {
            embeddingDimension: 128,
            walkLength: 20,
            walksPerNode: 10
        })
        YIELD nodeId, embedding
        WITH c, gds.util.asNode(nodeId) AS other, embedding
        WHERE other.id <> c.id
        WITH other,
             gds.similarity.cosine(c.node2vec_embedding, embedding) AS similarity,
             size((other)-[:CONNECTED_TO]-()) AS shared
        RETURN other.id AS company_id,
               other.name AS company_name,
               similarity,
               shared AS shared_connections
        ORDER BY similarity DESC
        LIMIT $top_n
        """
        records = await self._run(query, company_id=company_id, top_n=top_n)

        return [
            SimilarCompany(
                company_id=r["company_id"],
                company_name=r["company_name"],
                similarity=round(r["similarity"], 4),
                shared_connections=r["shared_connections"],
            )
            for r in records
        ]

    # ── Shortest Path (Fraud Chain) ──────────────────────────

    async def find_fraud_chains(
        self, start_company_id: str, max_depth: int = 5
    ) -> list[dict[str, Any]]:
        """Знаходить ланцюжки зв'язків між компаніями."""
        query = """
        MATCH path = (start:Company {id: $start_id})-[:CONNECTED_TO*1..$depth]-(end:Company)
        WHERE end.risk_score > 0.7
        WITH path, end,
             reduce(risk = 0, n IN nodes(path) | risk + coalesce(n.risk_score, 0)) AS total_risk,
             length(path) AS hops
        RETURN end.id AS target_id,
               end.name AS target_name,
               hops,
               total_risk,
               [n IN nodes(path) | n.name] AS chain
        ORDER BY total_risk DESC
        LIMIT 20
        """
        records = await self._run(query, start_id=start_company_id, depth=max_depth)

        return [
            {
                "target_id": r["target_id"],
                "target_name": r["target_name"],
                "hops": r["hops"],
                "total_risk": round(r["total_risk"], 4),
                "chain": r["chain"],
            }
            for r in records
        ]

    # ── Graph Statistics ─────────────────────────────────────

    async def get_graph_stats(self) -> dict[str, Any]:
        """Отримує статистику графа."""
        query = """
        MATCH (n:Company)
        RETURN count(n) AS total_companies,
               avg(n.risk_score) AS avg_risk,
               max(n.risk_score) AS max_risk,
               count { (n)-[:CONNECTED_TO]-() } AS total_connections
        """
        records = await self._run(query)
        if records:
            r = records[0]
            return {
                "total_companies": r["total_companies"],
                "avg_risk": round(r["avg_risk"], 4) if r["avg_risk"] else 0,
                "max_risk": round(r["max_risk"], 4) if r["max_risk"] else 0,
                "total_connections": r["total_connections"],
            }
        return {"total_companies": 0, "avg_risk": 0, "max_risk": 0, "total_connections": 0}


# ── Factory ──────────────────────────────────────────────────

_gds_client: Neo4jGDSClient | None = None


def get_gds_client(driver: Any | None = None) -> Neo4jGDSClient:
    """Отримати синглтон GDS клієнта."""
    global _gds_client
    if _gds_client is None:
        if driver is None:
            raise ValueError("Neo4j driver is required for first init")
        _gds_client = Neo4jGDSClient(driver)
    return _gds_client
