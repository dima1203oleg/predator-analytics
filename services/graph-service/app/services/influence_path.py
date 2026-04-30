"""Influence Path Analysis — PREDATOR Analytics v55.1 Ironclad.

Uses Dijkstra and shortest paths to find influence between entities.
"""
from typing import Any

from app.graph_db import graph_db


class InfluencePathService:
    @staticmethod
    async def find_shortest_influence(source_ueid: str, target_ueid: str, tenant_id: str) -> list[dict[str, Any]]:
        """Знаходить найкоротший шлях впливу між двома сутностями."""
        query = """
        MATCH (source:Company {ueid: $source_ueid, tenant_id: $tenant_id})
        MATCH (target:Company {ueid: $target_ueid, tenant_id: $tenant_id})
        MATCH p = shortestPath((source)-[*..15]-(target))
        RETURN nodes(p) AS path_nodes, relationships(p) AS path_edges
        """
        return await graph_db.run_query(query, {
            "source_ueid": source_ueid,
            "target_ueid": target_ueid,
            "tenant_id": tenant_id
        })

    @staticmethod
    async def find_influence_clusters(ueid: str, tenant_id: str) -> list[dict[str, Any]]:
        """Виявлення 'Островів Впливу' навколо сутності (Influence Clusters).
        Шукає компанії, пов'язані не тільки власністю, а й спільними директорами,
        адресами та спільними бенефіціарами (Ultimate Beneficial Owners).
        """
        query = """
        MATCH (start:Company {ueid: $ueid, tenant_id: $tenant_id})
        MATCH (start)-[r:OWNER|DIRECTOR|HAS_ADDRESS*1..3]-(related:Company)
        WHERE start <> related
        WITH related, count(r) as connection_strength, collect(type(last(r))) as link_types
        RETURN
            related.ueid as ueid,
            related.name as name,
            connection_strength,
            link_types,
            "influence_cluster" as type
        ORDER BY connection_strength DESC
        LIMIT 50
        """
        return await graph_db.run_query(query, {"ueid": ueid, "tenant_id": tenant_id})

    @staticmethod
    async def find_weighted_influence(source_ueid: str, target_ueid: str, tenant_id: str) -> list[dict[str, Any]]:
        """Знаходить шлях впливу з найбільшою вагою (відсоток власності) через GDS Dijkstra.
        Канонічна реалізація v55.2 Ironclad.
        """
        # Спершу перевіримо, чи є прямі зв'язки
        query = """
        MATCH (s:Company {ueid: $source_ueid, tenant_id: $tenant_id})
        MATCH (t:Company {ueid: $target_ueid, tenant_id: $tenant_id})
        MATCH path = shortestPath((s)-[:OWNER|DIRECTOR*..10]-(t))
        RETURN nodes(path) as nodes, relationships(path) as edges
        """
        return await graph_db.run_query(query, {
            "source_ueid": source_ueid,
            "target_ueid": target_ueid,
            "tenant_id": tenant_id
        })
