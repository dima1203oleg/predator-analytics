"""
Predator Analytics - Integration Router
External system integrations and webhooks
"""
from fastapi import APIRouter, HTTPException, Header, Request
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from datetime import datetime
from enum import Enum

router = APIRouter(prefix="/integration", tags=["Integration"])


class IntegrationType(str, Enum):
    WEBHOOK = "webhook"
    API = "api"
    DATABASE = "database"
    STREAM = "stream"


class IntegrationStatus(str, Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    ERROR = "ERROR"
    PENDING = "PENDING"


class Integration(BaseModel):
    id: str
    name: str
    type: IntegrationType
    status: IntegrationStatus
    endpoint: Optional[str] = None
    last_sync: Optional[datetime] = None
    error_message: Optional[str] = None


class WebhookPayload(BaseModel):
    event: str
    data: Dict[str, Any]
    timestamp: datetime


# Mock integrations storage
_integrations: Dict[str, Integration] = {
    "prozorro": Integration(
        id="prozorro",
        name="Prozorro API",
        type=IntegrationType.API,
        status=IntegrationStatus.ACTIVE,
        endpoint="https://public.api.openprocurement.org/api/2.5",
        last_sync=datetime.utcnow()
    ),
    "edr": Integration(
        id="edr",
        name="EDR (Business Registry)",
        type=IntegrationType.API,
        status=IntegrationStatus.ACTIVE,
        endpoint="https://data.gov.ua/api/3/action",
        last_sync=datetime.utcnow()
    ),
    "nbu": Integration(
        id="nbu",
        name="NBU Exchange Rates",
        type=IntegrationType.API,
        status=IntegrationStatus.ACTIVE,
        endpoint="https://bank.gov.ua/NBUStatService/v1",
        last_sync=datetime.utcnow()
    )
}


@router.get("/", response_model=List[Integration])
async def list_integrations():
    """List all configured integrations"""
    return list(_integrations.values())


@router.get("/{integration_id}", response_model=Integration)
async def get_integration(integration_id: str):
    """Get integration by ID"""
    if integration_id not in _integrations:
        raise HTTPException(status_code=404, detail="Integration not found")
    return _integrations[integration_id]


@router.post("/{integration_id}/sync")
async def sync_integration(integration_id: str):
    """Trigger manual sync for an integration"""
    if integration_id not in _integrations:
        raise HTTPException(status_code=404, detail="Integration not found")
    
    integration = _integrations[integration_id]
    integration.last_sync = datetime.utcnow()
    integration.status = IntegrationStatus.ACTIVE
    
    return {
        "message": f"Sync triggered for {integration.name}",
        "integration": integration
    }


@router.post("/webhook/{source}")
async def receive_webhook(
    source: str,
    payload: WebhookPayload,
    x_webhook_secret: Optional[str] = Header(None)
):
    """Receive webhook from external source"""
    # In production, validate webhook secret
    return {
        "received": True,
        "source": source,
        "event": payload.event,
        "processed_at": datetime.utcnow().isoformat()
    }


@router.get("/health/all")
async def check_all_integrations():
    """Health check for all integrations"""
    results = []
    for integration in _integrations.values():
        results.append({
            "id": integration.id,
            "name": integration.name,
            "healthy": integration.status == IntegrationStatus.ACTIVE,
            "last_check": datetime.utcnow().isoformat()
        })
    
    all_healthy = all(r["healthy"] for r in results)
    return {
        "status": "HEALTHY" if all_healthy else "DEGRADED",
        "integrations": results
    }
