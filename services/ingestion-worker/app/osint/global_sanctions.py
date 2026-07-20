"""Global Sanctions Service — PREDATOR Analytics v61.0-ELITE.

Забезпечує перевірку суб'єктів за міжнародними списками санкцій (OFAC, EU, UK).
"""
import logging
from typing import Any

from app.config import get_settings

logger = logging.getLogger(__name__)

class GlobalSanctionsService:
    """Сервіс для перевірки міжнародних санкцій."""

    def __init__(self):
        self.settings = get_settings()
        # У реальному середовищі тут будуть URL для OpenSanctions або аналогічних API
        self.sources = {
            "OFAC": "https://api.opensanctions.org/match/us_ofac_sdn",
            "EU": "https://api.opensanctions.org/match/eu_fsf",
            "UK": "https://api.opensanctions.org/match/gb_hmt"
        }

    async def check_entity(self, name: str, entity_type: str = "organization") -> dict[str, Any]:
        """Перевірка особи або компанії за міжнародними списками.

        Повертає статус та перелік знайдених збігів з OpenSearch.
        """
        logger.info(f"Checking global sanctions for: {name}")

        try:
            from app.services.opensearch_service import opensearch_service
            
            search_result = await opensearch_service.search(
                entity="sanctions",
                tenant_id="global",
                query=name,
                fields=["name", "aliases", "keywords"],
                size=5
            )

            matches = []
            for hit in search_result.hits:
                # Вважаємо збіг, якщо score вище певного порогу (наприклад 5.0)
                if hit.score > 5.0:
                    matches.append({
                        "list": hit.source.get("dataset", "Unknown Sanctions List"),
                        "reason": f"OpenSearch match with score {hit.score:.2f}",
                        "confidence": min(hit.score / 20.0, 0.99)
                    })

            return {
                "is_sanctioned": len(matches) > 0,
                "matches": matches,
                "checked_at": "now"
            }
        except Exception as e:
            logger.error(f"GlobalSanctionsService error: {e}")
            return {
                "is_sanctioned": False,
                "matches": [],
                "checked_at": "now",
                "error": str(e)
            }

    async def get_sanction_risk_increase(self, name: str) -> float:
        """Повертає вагу ризику на основі санкцій."""
        result = await self.check_entity(name)
        if result["is_sanctioned"]:
            # Максимальний рівень ризику для санкцій
            return 100.0
        return 0.0
