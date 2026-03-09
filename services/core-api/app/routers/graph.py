"""
Graph Router — PREDATOR Analytics v55.1 Ironclad.

Neo4j graph analysis: owners, related parties, network traversal.
"""
from typing import List, Dict, Any, Optional

from fastapi import APIRouter, Depends, HTTPException
from app.core.graph import graph_db
from app.dependencies import PermissionChecker, get_tenant_id
from app.core.permissions import Permission

router = APIRouter(prefix="/graph", tags=["graph"])


@router.get("/{ueid}/neighbors")
async def get_entity_neighbors(
    ueid: str,
    depth: int = 1,
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.RUN_GRAPH]))
):
    """Отримання сусідніх вузлів у графі для сутності (UEID)."""
    # Cypher запит з урахуванням tenant_id (якщо він зберігається як property на нодах)
    query = """
    MATCH (n {ueid: $ueid})-[r]-(m)
    WHERE n.tenant_id = $tenant_id AND m.tenant_id = $tenant_id
    RETURN n, r, m
    LIMIT 100
    """
    try:
        results = await graph_db.run_query(query, {"ueid": ueid, "tenant_id": tenant_id})
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Graph query failed: {str(e)}")


@router.get("/{ueid}/shortest-path/{target_ueid}")
async def get_shortest_path(
    ueid: str,
    target_ueid: str,
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.RUN_GRAPH]))
):
    """Пошук найкоротшого шляху між двома сутностями."""
    query = """
    MATCH p = shortestPath((n {ueid: $ueid})-[*..5]-(m {ueid: $target_ueid}))
    WHERE n.tenant_id = $tenant_id AND m.tenant_id = $tenant_id
    RETURN p
    """
    results = await graph_db.run_query(query, {
        "ueid": ueid, 
        "target_ueid": target_ueid, 
        "tenant_id": tenant_id
    })
    
    if not results:
        raise HTTPException(status_code=404, detail="Шлях не знайдено")
        
    return results
