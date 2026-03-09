"""
Cartel Detector — PREDATOR Analytics v55.1 Ironclad.

Uses Louvain community detection algorithm to find suspicious clusters and cartels.
"""
from typing import List, Dict, Any
from app.graph_db import graph_db

class CartelDetectorService:
    @staticmethod
    async def detect_communities(tenant_id: str) -> List[Dict[str, Any]]:
        """Використання Louvain для виявлення щільних кластерів (ком'юніті)."""
        # Graph Data Science (GDS) Louvain community detection
        query = """
        CALL gds.louvain.stream({
            nodeQuery: 'MATCH (c:Company {tenant_id: $tenant_id}) RETURN id(c) AS id',
            relationshipQuery: 'MATCH (c1:Company)-[r]-(c2:Company) RETURN id(c1) AS source, id(c2) AS target',
            validateRelationships: false
        })
        YIELD nodeId, communityId
        RETURN gds.util.asNode(nodeId).ueid AS company_ueid, gds.util.asNode(nodeId).name AS name, communityId
        ORDER BY communityId ASC
        """
        try:
            return await graph_db.run_query(query, {"tenant_id": tenant_id})
        except Exception:
            # Fallback to simple common owners if GDS is not installed
            fallback_query = """
            MATCH (c1:Company {tenant_id: $tenant_id})-[r1:OWNER]-(owner)-[r2:OWNER]-(c2:Company {tenant_id: $tenant_id})
            WHERE c1 <> c2
            RETURN c1.name AS company1, c2.name AS company2, owner.name AS shared_owner, COUNT(owner) as risk_score
            """
            return await graph_db.run_query(fallback_query, {"tenant_id": tenant_id})

    @staticmethod
    async def find_cartel_rings(tenant_id: str) -> List[Dict[str, Any]]:
        """Виявлення 'кілець' для пошуку картельних змов у тендерах."""
        query = """
        MATCH (c1:Company)-[:PARTICIPATED_IN]->(t:Tender)<-[:PARTICIPATED_IN]-(c2:Company)
        MATCH p = (c1)-[*1..3]-(c2)
        WHERE c1 <> c2 AND id(c1) < id(c2)
        RETURN c1.name, c2.name, length(p) as distance, t.id as tender_id
        """
        return await graph_db.run_query(query, {"tenant_id": tenant_id})
