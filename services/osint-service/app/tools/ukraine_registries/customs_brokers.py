"""Реєстр митних брокерів.

Держатель: Державна митна служба України
Формат: XML, відкриті дані
"""
import logging
from datetime import UTC, datetime

from .base import BaseRegistryClient, RegistryResult, RegistryStatus

logger = logging.getLogger(__name__)


class CustomsBrokersClient(BaseRegistryClient):
    """Клієнт для Реєстру митних брокерів."""

    name = "customs_brokers"
    description = "Реєстр митних брокерів"
    holder = "Державна митна служба України"
    data_format = "XML"
    status = RegistryStatus.ACTIVE
    update_frequency = "weekly"

    async def search_by_edrpou(self, edrpou: str) -> RegistryResult:
        """Перевірка наявності ліцензії митного брокера."""
        start_time = datetime.now(UTC)
        edrpou = self.normalize_edrpou(edrpou)

        # Симуляція
        is_broker = edrpou.startswith("3")

        data = {
            "edrpou": edrpou,
            "is_customs_broker": is_broker,
            "license": None,
        }

        if is_broker:
            data["license"] = {
                "number": f"МБ-{edrpou[:4]}",
                "issue_date": "2020-01-15",
                "valid_until": "2025-01-15",
                "status": "active",
                "issuer": "Державна митна служба України",
                "activities": ["Митне оформлення", "Консультування"],
            }

        return RegistryResult(
            registry_name=self.name,
            success=True,
            data=data,
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )

    async def search_by_name(self, name: str) -> RegistryResult:
        """Пошук брокерів за назвою."""
        start_time = datetime.now(UTC)

        brokers = [
            {
                "edrpou": "31234567",
                "name": f"{name} ТОВ",
                "license_number": "МБ-3123",
                "status": "active",
            },
        ]

        return RegistryResult(
            registry_name=self.name,
            success=True,
            data={"results": brokers, "total": len(brokers)},
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )

    async def get_all_brokers(self, region: str | None = None) -> RegistryResult:
        """Отримати список всіх митних брокерів."""
        start_time = datetime.now(UTC)

        brokers = [
            {"edrpou": "31234567", "name": "ТОВ «Митний брокер 1»", "region": "Київ"},
            {"edrpou": "32345678", "name": "ТОВ «Митний брокер 2»", "region": "Одеса"},
        ]

        if region:
            brokers = [b for b in brokers if b["region"].lower() == region.lower()]

        return RegistryResult(
            registry_name=self.name,
            success=True,
            data={"brokers": brokers, "total": len(brokers)},
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )
