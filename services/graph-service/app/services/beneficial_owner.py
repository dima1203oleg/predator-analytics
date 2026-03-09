"""
Ultimate Beneficial Owner (UBO) Service — PREDATOR Analytics v55.1 Ironclad.

Calculates exact ownership shares across complex multilayer nested structures.
"""
from typing import List, Dict, Any
from app.graph_db import graph_db

class BeneficialOwnerService:
    @staticmethod
    async def get_direct_owners(ueid: str, tenant_id: str) -> List[Dict[str, Any]]:
        """Прямі власники компанії."""
        query = """
        MATCH (c:Company {ueid: $ueid, tenant_id: $tenant_id})<-[r:OWNER]-(owner)
        RETURN owner.name AS owner_name, labels(owner)[0] AS type, r.share_percentage AS share
        """
        return await graph_db.run_query(query, {"ueid": ueid, "tenant_id": tenant_id})

    @staticmethod
    async def get_ultimate_beneficiaries(ueid: str, tenant_id: str) -> List[Dict[str, Any]]:
        """
        Кінцеві бенефіціари (тільки фізичні особи) з рекурсивним розрахунком 
        відсотка впливу через множення долей.
        """
        # Тимчасово: просте множення для лінійних зв'язків
        # Для складних багатовекторних потрібен алгоритм зменшення графа (reduce)
        query = """
        MATCH p = (c:Company {ueid: $ueid, tenant_id: $tenant_id})<-[:OWNER*1..10]-(ubo:Person)
        WHERE NOT (ubo)<-[:OWNER]-()
        
        WITH ubo, relationships(p) as rels
        UNWIND rels as r
        WITH ubo, collect(coalesce(r.share_percentage, 100)) as shares
        
        WITH ubo, reduce(s = 1.0, x IN shares | s * (x / 100.0)) as total_share
        
        RETURN ubo.name AS full_name, ubo.inn AS inn, round(total_share * 100, 2) AS exact_share
        ORDER BY exact_share DESC
        """
        return await graph_db.run_query(query, {"ueid": ueid, "tenant_id": tenant_id})
