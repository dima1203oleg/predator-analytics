"""UA Connectors Service (Phase 10 — SM Edition).

Integration clients for Opendatabot, YouControl, and Prozorro.
Mocks real external calls for the Single Machine environment.
"""
from datetime import UTC, datetime
from typing import Any


class OpendatabotClient:
    """Client for Opendatabot API (Registry Data)."""

    def get_company_info(self, edrpou: str) -> dict[str, Any]:
        """Отримати дані компанії з ЄДР через Опендатабот."""
        return {
            "edrpou": edrpou,
            "name": f"ТОВ КОМПАНІЯ-{edrpou}",
            "status": "зареєстровано",
            "director": "Іваненко Іван Іванович",
            "address": "м. Київ, вул. Хрещатик, 1",
            "kved": "62.01 Комп'ютерне програмування",
            "source": "Opendatabot",
            "fetched_at": datetime.now(UTC).isoformat(),
        }

    def get_court_cases(self, edrpou: str) -> list[dict[str, Any]]:
        """Отримати судові справи компанії."""
        return [
            {"case_number": f"910/{edrpou}/25", "type": "Господарська", "status": "Розгляд", "date": "2025-10-15"},
        ]


class YouControlClient:
    """Client for YouControl API (Sanctions & Risk)."""

    def check_sanctions(self, edrpou: str) -> dict[str, Any]:
        """Перевірка по санкційних списках (РНБО, OFAC, ЄС)."""
        is_sanctioned = edrpou.startswith("999")  # Mock condition
        return {
            "edrpou": edrpou,
            "has_sanctions": is_sanctioned,
            "lists_checked": ["РНБО", "СБУ", "OFAC", "EU"],
            "details": ["Санкції РНБО від 12.05.2024"] if is_sanctioned else [],
            "source": "YouControl",
            "fetched_at": datetime.now(UTC).isoformat(),
        }

    def get_express_risk(self, edrpou: str) -> dict[str, Any]:
        """Експрес-аналіз ризиків (FinScore, MarketScore)."""
        return {
            "edrpou": edrpou,
            "fin_score": "B",
            "market_score": "A",
            "risk_index": 25,  # 0-100
            "source": "YouControl",
        }


class ProzorroClient:
    """Client for Prozorro API (Public Procurement)."""

    def get_tenders(self, edrpou: str) -> dict[str, Any]:
        """Отримати тендери компанії."""
        return {
            "edrpou": edrpou,
            "total_tenders": 15,
            "won_tenders": 12,
            "total_volume_uah": 5_400_000.0,
            "recent_tenders": [
                {"id": "UA-2025-01-01-123456-a", "item": "Послуги з розробки ПЗ", "status": "Активний"},
            ],
            "source": "Prozorro",
            "fetched_at": datetime.now(UTC).isoformat(),
        }
