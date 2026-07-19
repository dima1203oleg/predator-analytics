import logging
from datetime import UTC, datetime
from typing import Any

from app.services.kafka_producer import publish_event
from app.config import get_settings
import httpx

logger = logging.getLogger("ua_registry_gateway.opendatabot")

async def query_court_cases(edrpou: str) -> list[dict[str, Any]]:
    """Integration for Opendatabot Court Cases API (with Smart Mock fallback)."""
    settings = get_settings()
    logger.info(f"Querying Opendatabot courts for EDRPOU {edrpou}")
    
    if settings.OPENDATABOT_API_KEY and settings.OPENDATABOT_API_KEY != "mock":
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"https://opendatabot.com/api/v3/company/{edrpou}/court",
                    headers={"Authorization": f"Bearer {settings.OPENDATABOT_API_KEY}"}
                )
                response.raise_for_status()
                data = response.json().get("cases", [])
        except Exception as e:
            logger.error(f"Failed to query Opendatabot API: {e}")
            raise
    else:
        data = [
            {
                "case_num": f"910/{edrpou[:4]}/24",
                "date": "2024-05-12",
                "type": "Господарська справа",
                "plaintiff": "ДПС",
                "defendant": f"ТОВ КОМПАНІЯ {edrpou}"
            }
        ]
    
    event = {
        "source": "ua.opendatabot",
        "event_type": "court.fetched",
        "collected_at": datetime.now(UTC).isoformat(),
        "payload": {"edrpou": edrpou, "cases": data}
    }
    
    await publish_event("ingestion.raw.opendatabot", event)
    return data
