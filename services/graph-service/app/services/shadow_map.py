"""
Shadow Map Service — PREDATOR Analytics v55.1 Ironclad.

Discovers hidden relationships through seemingly unrelated commonalities 
(same phone, IP, address, shared secretary).
"""
from typing import List, Dict, Any
from app.graph_db import graph_db

class ShadowMapService:
    @staticmethod
    async def get_shadow_connections(ueid: str, tenant_id: str, max_depth: int = 2) -> List[Dict[str, Any]]:
        """Виявлення тіньових зв'язків через спільні метадані."""
        query = f"""
        MATCH (c1:Company {{ueid: $ueid, tenant_id: $tenant_id}})
        MATCH (c1)-[r1:HAS_PHONE|HAS_ADDRESS|HAS_IP]->(meta)<-[r2:HAS_PHONE|HAS_ADDRESS|HAS_IP]-(c2:Company)
        WHERE c1 <> c2
        RETURN c2.name as related_company, labels(meta)[0] as connection_type, meta.value as shared_value
        LIMIT 100
        """
        return await graph_db.run_query(query, {"ueid": ueid, "tenant_id": tenant_id})

    @staticmethod
    async def find_hidden_cluster(ueid: str, tenant_id: str) -> Dict[str, Any]:
        """Знаходження цілої тіньової мережі пов'язаної з сутністю."""
        query = """
        MATCH (start:Company {ueid: $ueid, tenant_id: $tenant_id})
        CALL apoc.path.subgraphAll(start, {
            maxLevel: 3,
            relationshipFilter: "HAS_PHONE>|<HAS_PHONE|HAS_ADDRESS>|<HAS_ADDRESS|OWNER>|<OWNER"
        }) YIELD nodes, relationships
        RETURN [n IN nodes | n.ueid] AS cluster_nodes, size(relationships) as total_connections
        """
        results = await graph_db.run_query(query, {"ueid": ueid, "tenant_id": tenant_id})
        return results[0] if results else {}
