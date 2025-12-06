"""Integrations Router - External system integrations"""
from fastapi import APIRouter
from typing import List
from datetime import datetime, timezone
from app.services.connector_registry import connector_registry

router = APIRouter(prefix="/integrations", tags=["Integrations"])


@router.get("/")
async def list_integrations():
    """List all integrations"""
    statuses = await connector_registry.health_check_all()
    integrations = []
    
    for name in connector_registry.list_all():
        integrations.append({
            "id": name,
            "name": name.upper(),
            "status": statuses.get(name, "UNKNOWN")
        })
    
    return integrations


@router.get("/{integration_id}/status")
async def get_integration_status(integration_id: str):
    """Get integration status"""
    statuses = await connector_registry.health_check_all()
    status = statuses.get(integration_id, "UNKNOWN")
    
    return {
        "id": integration_id,
        "status": status,
        "last_sync": datetime.now(timezone.utc).isoformat()
    }
