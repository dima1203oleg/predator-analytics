import logging
from datetime import UTC, datetime
from typing import Any

from app.services.kafka_producer import publish_event
from app.config import get_settings
import httpx

logger = logging.getLogger("ua_registry_gateway.youcontrol")

async def query_company(edrpou: str) -> dict[str, Any]:
    """Integration for YouControl API (with Smart Mock fallback)."""
    settings = get_settings()
    logger.info(f"Querying YouControl for EDRPOU {edrpou}")
    
    if settings.YOUCONTROL_API_KEY and settings.YOUCONTROL_API_KEY != "mock":
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"https://api.youcontrol.com.ua/api/company/{edrpou}",
                    headers={"Authorization": f"Bearer {settings.YOUCONTROL_API_KEY}"}
                )
                response.raise_for_status()
                data = response.json()
        except Exception as e:
            logger.error(f"Failed to query YouControl API: {e}")
            raise
    else:
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
    """Integration for YouControl Person API (with Smart Mock fallback)."""
    settings = get_settings()
    logger.info(f"Querying YouControl for person: {name}")
    
    if settings.YOUCONTROL_API_KEY and settings.YOUCONTROL_API_KEY != "mock":
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    "https://api.youcontrol.com.ua/api/person/search",
                    params={"name": name},
                    headers={"Authorization": f"Bearer {settings.YOUCONTROL_API_KEY}"}
                )
                response.raise_for_status()
                data = response.json()
        except Exception as e:
            logger.error(f"Failed to query YouControl API: {e}")
            raise
    else:
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
