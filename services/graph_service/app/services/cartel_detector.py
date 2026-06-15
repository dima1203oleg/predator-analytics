"""Cartel Detector — PREDATOR Analytics v55.2-SM-EXTENDED.
Trinity Engine:Louvain Community Detection & Bid Rigging Patterns.
"""
from typing import Any

from app.graph_db import graph_db


class CartelDetectorService:
    @staticmethod
    async def detect_communities(tenant_id: str) -> list[dict[str, Any]]:
        """Використання Louvain для виявлення щільних кластерів (ком'юніті) v55.2."""
        query = """
        CALL gds.louvain.stream({
            nodeQuery: 'MATCH (c:Company {tenant_id: $tenant_id}) RETURN id(c) AS id',
            relationshipQuery: 'MATCH (c1:Company)-[r]-(c2:Company) RETURN id(c1) AS source, id(c2) AS target',
            validateRelationships: false
        })
        YIELD nodeId, communityId
        WITH communityId, collect(nodeId) as nodes
        WHERE size(nodes) > 2
        UNWIND nodes as nodeId
        MATCH (c) WHERE id(c) = nodeId
        RETURN c.ueid as ueid, c.name as name, communityId, size(nodes) as cluster_size
        ORDER BY communityId ASC
        """
        try:
            return await graph_db.run_query(query, {"tenant_id": tenant_id})
        except Exception:
            # Канонічний фолбек v55.2: спільні директори та адреси
            fallback_query = """
            MATCH (c1:Company {tenant_id: $tenant_id})-[r1:OWNER|DIRECTOR|HAS_ADDRESS]-(shared)-[r2:OWNER|DIRECTOR|HAS_ADDRESS]-(c2:Company {tenant_id: $tenant_id})
            WHERE c1 <> c2 AND id(c1) < id(c2)
            RETURN c1.name AS co1, c2.name AS co2, shared.name as bridge, labels(shared)[0] as bridge_type
            LIMIT 50
            """
            return await graph_db.run_query(fallback_query, {"tenant_id": tenant_id})

    @staticmethod
    async def find_cartel_rings(tenant_id: str) -> list[dict[str, Any]]:
        """Виявлення Bid Rigging (змов на тендерах).
        Шукає компанії, які разом беруть участь у тендерах ТА мають спільних бенефіціарів.
        """
        query = """
        MATCH (c1:Company)-[:PARTICIPATED_IN]->(t:Tender)<-[:PARTICIPATED_IN]-(c2:Company)
        WHERE c1.tenant_id = $tenant_id AND c2.tenant_id = $tenant_id
        MATCH (c1)-[*1..2]-(common)-[*1..2]-(c2)
        WHERE NOT (common:Tender) AND c1 <> c2
        RETURN
            t.tender_id as tender,
            c1.name as member1,
            c2.name as member2,
            common.name as connection,
            "high_risk" as pattern_type
        LIMIT 100
        """
        return await graph_db.run_query(query, {"tenant_id": tenant_id})
