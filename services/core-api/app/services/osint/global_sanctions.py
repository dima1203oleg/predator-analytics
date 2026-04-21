"""Global Sanctions Service — PREDATOR Analytics v56.5-ELITE.

Забезпечує перевірку суб'єктів за міжнародними списками санкцій (OFAC, EU, UK).
"""
import logging
from typing import Any, List
import httpx
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
        
        Повертає статус та перелік знайдених збігів.
        """
        logger.info(f"Checking global sanctions for: {name}")
        
        # Для демонстрації та відсутності токенів використовуємо Mock-логіку
        # У продакшн-режимі тут буде httpx.post(source_url, json={"queries": [...]})
        
        # Симуляція перевірки (можна розширити логікою збігу імен)
        matches = []
        suspicious_keywords = ["al-qaeda", "isis", "hezbollah", "wagner", "rosatom"]
        
        for keyword in suspicious_keywords:
            if keyword in name.lower():
                matches.append({
                    "list": "OFAC / SDN",
                    "reason": f"Match with keyword '{keyword}'",
                    "confidence": 0.95
                })

        return {
            "is_sanctioned": len(matches) > 0,
            "matches": matches,
            "checked_at": "now"
        }

    async def get_sanction_risk_increase(self, name: str) -> float:
        """Повертає вагу ризику на основі санкцій."""
        result = await self.check_entity(name)
        if result["is_sanctioned"]:
            # Максимальний рівень ризику для санкцій
            return 100.0
        return 0.0
