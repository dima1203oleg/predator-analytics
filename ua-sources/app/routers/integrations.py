"""Integrations Router - External system integrations"""
from fastapi import APIRouter
from typing import List
from datetime import datetime

router = APIRouter(prefix="/integrations", tags=["Integrations"])


@router.get("/")
async def list_integrations():
    """List all integrations"""
    return [
        {"id": "prozorro", "name": "Prozorro", "status": "ACTIVE"},
        {"id": "edr", "name": "EDR", "status": "ACTIVE"},
        {"id": "nbu", "name": "NBU", "status": "ACTIVE"},
    ]


@router.get("/{integration_id}/status")
async def get_integration_status(integration_id: str):
    """Get integration status"""
    return {
        "id": integration_id,
        "status": "ACTIVE",
        "last_sync": datetime.utcnow().isoformat()
    }
