"""Shadow Map Service — PREDATOR Analytics v55.2-SM-EXTENDED.
Trinity Engine: Детекція прихованих мереж впливу та непрямого контролю.
"""
from typing import Any

from app.graph_db import graph_db


class ShadowMapService:
    @staticmethod
    async def get_shadow_connections(ueid: str, tenant_id: str, max_depth: int = 3) -> list[dict[str, Any]]:
        """Виявлення тіньових зв'язків v55.2.
        Аналізує спільні активи, адреси та зв'язки через офшори.
        """
        query = """
        MATCH (c1:Company {ueid: $ueid, tenant_id: $tenant_id})
        MATCH (c1)-[*1..$depth]-(m)-[*1..$depth]-(c2:Company)
        WHERE c1 <> c2 AND NOT (m:Tender)
        AND (m:Offshore OR m:Person OR m:Address OR m:Phone)
        RETURN
            c2.ueid as related_ueid,
            c2.name as related_name,
            labels(m)[0] as bridge_type,
            m.value as bridge_value
        LIMIT 100
        """
        return await graph_db.run_query(query, {
            "ueid": ueid,
            "tenant_id": tenant_id,
            "depth": max_depth
        })

    @staticmethod
    async def find_hidden_cluster(ueid: str, tenant_id: str) -> dict[str, Any]:
        """Знаходження повної тіньової екосистеми сутності.
        Використовує APOC для глибокого обходу графа.
        """
        query = """
        MATCH (start:Company {ueid: $ueid, tenant_id: $tenant_id})
        CALL apoc.path.subgraphAll(start, {
            maxLevel: 3,
            relationshipFilter: "OWNER>|<OWNER|DIRECTOR>|<DIRECTOR|HAS_ADDRESS>|<HAS_ADDRESS|HAS_PHONE>|<HAS_PHONE"
        }) YIELD nodes, relationships
        RETURN
            [n IN nodes WHERE n:Company | n.ueid] AS companies,
            [n IN nodes WHERE n:Person | n.name] AS individuals,
            size(relationships) as total_links
        """
        results = await graph_db.run_query(query, {"ueid": ueid, "tenant_id": tenant_id})
        return results[0] if results else {}
