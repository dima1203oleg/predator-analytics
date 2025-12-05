"""Sources Router - Data sources management"""
from fastapi import APIRouter
from datetime import datetime

router = APIRouter(prefix="/sources", tags=["Sources"])


@router.get("/")
async def list_sources():
    """List all data sources"""
    return [
        {
            "id": "prozorro",
            "name": "Prozorro",
            "type": "API",
            "status": "ACTIVE",
            "last_sync": datetime.utcnow().isoformat()
        },
        {
            "id": "edr",
            "name": "EDR (Business Registry)",
            "type": "API",
            "status": "ACTIVE",
            "last_sync": datetime.utcnow().isoformat()
        },
        {
            "id": "nbu",
            "name": "NBU Exchange Rates",
            "type": "API",
            "status": "ACTIVE",
            "last_sync": datetime.utcnow().isoformat()
        },
        {
            "id": "tax",
            "name": "Tax Registry",
            "type": "API",
            "status": "ACTIVE",
            "last_sync": datetime.utcnow().isoformat()
        },
        {
            "id": "customs",
            "name": "Customs Data",
            "type": "API",
            "status": "DEGRADED",
            "last_sync": None
        }
    ]


@router.get("/{source_id}")
async def get_source(source_id: str):
    """Get source details"""
    return {
        "id": source_id,
        "status": "ACTIVE",
        "records_total": 0,
        "last_sync": datetime.utcnow().isoformat()
    }


@router.post("/{source_id}/sync")
async def sync_source(source_id: str):
    """Trigger source sync"""
    return {
        "source_id": source_id,
        "sync_id": f"sync-{source_id}-001",
        "status": "STARTED"
    }


@router.get("/{source_id}/health")
async def check_source_health(source_id: str):
    """Check source health"""
    return {
        "source_id": source_id,
        "healthy": True,
        "latency_ms": 150,
        "last_check": datetime.utcnow().isoformat()
    }
