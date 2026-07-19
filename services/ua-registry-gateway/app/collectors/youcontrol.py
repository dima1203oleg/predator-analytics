import logging
from datetime import UTC, datetime
from typing import Any

from app.services.kafka_producer import publish_event

logger = logging.getLogger("ua_registry_gateway.youcontrol")

async def query_company(edrpou: str) -> dict[str, Any]:
    """Mock integration for YouControl API."""
    logger.info(f"Querying YouControl for EDRPOU {edrpou}")
    
    # Generate mock response
    data = {
        "edrpou": edrpou,
        "name": f"ТОВ КОМПАНІЯ {edrpou}",
        "status": "active",
        "director": "Кізима Дмитро Миколайович",
        "risk_score": 85.0
    }
    
    event = {
        "source": "ua.youcontrol",
        "event_type": "company.fetched",
        "collected_at": datetime.now(UTC).isoformat(),
        "payload": data
    }
    
    await publish_event("ingestion.raw.youcontrol", event)
    return data

async def query_person(name: str) -> dict[str, Any]:
    """Mock integration for YouControl Person API."""
    logger.info(f"Querying YouControl for person: {name}")
    
    data = {
        "full_name": name,
        "roles": ["director", "founder"],
        "related_companies": ["38294012"]
    }
    
    event = {
        "source": "ua.youcontrol",
        "event_type": "person.fetched",
        "collected_at": datetime.now(UTC).isoformat(),
        "payload": data
    }
    
    await publish_event("ingestion.raw.youcontrol", event)
    return data
