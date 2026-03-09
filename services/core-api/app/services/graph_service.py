"""
Graph Service — PREDATOR Analytics v55.1 Ironclad.

Logic for graph analysis, carousels of influence, and relationship discovery.
"""
from typing import List, Dict, Any
from app.core.graph import graph_db

class GraphService:
    @staticmethod
    async def find_ultimate_beneficiaries(ueid: str, tenant_id: str) -> List[Dict[str, Any]]:
        """Пошук кінцевих бенефіціарів (UBO) через ланцюжки власності."""
        query = """
        MATCH (c:Company {ueid: $ueid, tenant_id: $tenant_id})
        MATCH p = (c)<-[:OWNER*1..10]-(owner)
        WHERE NOT (owner)<-[:OWNER]-()
        RETURN owner, p
        """
        return await graph_db.run_query(query, {"ueid": ueid, "tenant_id": tenant_id})

    @staticmethod
    async def detect_circular_ownership(tenant_id: str) -> List[Dict[str, Any]]:
        """Виявлення циклічного володіння (схема 'змійка')."""
        query = """
        MATCH (n:Company {tenant_id: $tenant_id})
        MATCH p = (n)-[:OWNER*2..10]->(n)
        RETURN p
        """
        return await graph_db.run_query(query, {"tenant_id": tenant_id})
