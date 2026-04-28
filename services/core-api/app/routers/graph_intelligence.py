"""Graph Intelligence Router — PREDATOR Analytics v61.0-ELITE.

Розширена графова аналітика: пошук бенефіціарів (UBO), виявлення прихованих зв'язків.
"""
from fastapi import APIRouter, Depends, HTTPException
from app.services.neo4j_service import Neo4jService
from app.dependencies import PermissionChecker
from app.core.permissions import Permission

router = APIRouter(prefix="/graph-intelligence", tags=["Graph Intelligence"])

@router.get("/ubo/{ueid}", summary="Пошук кінцевого бенефіціара (UBO)")
async def get_ultimate_beneficiary(
    ueid: str,
    max_depth: int = 5,
    threshold: float = 25.0,
    _ = Depends(PermissionChecker([Permission.RUN_GRAPH]))
):
    """Визначає фізичну особу, яка стоїть за ланцюжком володіння компанією."""
    neo4j = Neo4jService()
    result = await neo4j.find_ultimate_beneficiary(org_id=ueid, max_depth=max_depth, threshold=threshold)
    
    if not result.success:
        raise HTTPException(status_code=500, detail=result.errors[0])
    
    return result.data
