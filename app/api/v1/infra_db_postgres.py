from fastapi import APIRouter, Depends
from typing import Dict, Any, List
from app.services.infrastructure.databases.postgres import PostgresHAManager, get_postgres_ha_manager

router = APIRouter(prefix="/infra/db/postgres", tags=["Infrastructure & Databases"])

@router.get("/health")
async def get_postgres_ha_health(
    manager: PostgresHAManager = Depends(get_postgres_ha_manager)
) -> Dict[str, Any]:
    """
    Returns the health of the PostgreSQL HA cluster (COMP-083+).
    """
    return manager.get_cluster_health()

@router.post("/failover")
async def manual_postgres_failover(
    manager: PostgresHAManager = Depends(get_postgres_ha_manager)
) -> Dict[str, Any]:
    """
    Triggers a manual database failover.
    """
    return manager.trigger_failover()
