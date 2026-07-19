import logging
from datetime import UTC, datetime
from typing import Any

from app.services.kafka_producer import publish_event

logger = logging.getLogger("ua_registry_gateway.opendatabot")

async def query_court_cases(edrpou: str) -> list[dict[str, Any]]:
    """Mock integration for Opendatabot Court Cases API."""
    logger.info(f"Querying Opendatabot courts for EDRPOU {edrpou}")
    
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
