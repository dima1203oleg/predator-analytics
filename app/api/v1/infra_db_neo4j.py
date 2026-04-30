from typing import Any

from fastapi import APIRouter, Depends

from app.services.infrastructure.databases.neo4j import (
    Neo4jClusterManager,
    get_neo4j_cluster_manager,
)

router = APIRouter(prefix="/infra/db/neo4j", tags=["Infrastructure & Databases"])

@router.get("/status")
async def get_neo4j_cluster_status(
    manager: Neo4jClusterManager = Depends(get_neo4j_cluster_manager)
) -> dict[str, Any]:
    """Returns the status of the Neo4j Causal Cluster (COMP-091).
    """
    return manager.get_cluster_status()
