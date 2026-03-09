"""
Influence Path Analysis — PREDATOR Analytics v55.1 Ironclad.

Uses Dijkstra and shortest paths to find influence between entities.
"""
from typing import List, Dict, Any
from app.graph_db import graph_db

class InfluencePathService:
    @staticmethod
    async def find_shortest_influence(source_ueid: str, target_ueid: str, tenant_id: str) -> List[Dict[str, Any]]:
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
    async def find_weighted_influence(source_ueid: str, target_ueid: str, tenant_id: str) -> List[Dict[str, Any]]:
        """Знаходить шлях впливу з найбільшою вагою (відсоток власності)."""
        # Graph Data Science (GDS) Dijkstra placeholder
        query = """
        MATCH (source:Company {ueid: $source_ueid, tenant_id: $tenant_id})
        MATCH (target:Company {ueid: $target_ueid, tenant_id: $tenant_id})
        CALL gds.shortestPath.dijkstra.stream({
            sourceNode: source,
            targetNode: target,
            nodeProjection: 'Company',
            relationshipProjection: {
                OWNER: {
                    type: 'OWNER',
                    properties: 'share_percentage'
                }
            },
            relationshipWeightProperty: 'share_percentage'
        })
        YIELD index, sourceNode, targetNode, totalCost, nodeIds, costs, path
        RETURN path, totalCost
        """
        # Тимчасово повертаємо пустий список, доки GDS не налаштовано повністю
        return []
