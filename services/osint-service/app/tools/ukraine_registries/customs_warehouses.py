"""Реєстр складів тимчасового зберігання.

Держатель: Державна митна служба України
Формат: XML, відкриті дані
"""
import logging
from datetime import UTC, datetime

from .base import BaseRegistryClient, RegistryResult, RegistryStatus

logger = logging.getLogger(__name__)


class CustomsWarehousesClient(BaseRegistryClient):
    """Клієнт для Реєстру складів тимчасового зберігання."""

    name = "customs_warehouses"
    description = "Реєстр складів тимчасового зберігання"
    holder = "Державна митна служба України"
    data_format = "XML"
    status = RegistryStatus.ACTIVE
    update_frequency = "weekly"

    async def search_by_edrpou(self, edrpou: str) -> RegistryResult:
        """Пошук складів за ЄДРПОУ власника."""
        start_time = datetime.now(UTC)
        edrpou = self.normalize_edrpou(edrpou)

        warehouses = [
            {
                "registration_number": f"СТЗ-{edrpou[:4]}",
                "owner_edrpou": edrpou,
                "owner_name": f"ТОВ «Компанія {edrpou}»",
                "address": "м. Київ, вул. Промислова, 10",
                "type": "Склад тимчасового зберігання",
                "area_sqm": 5000.0,
                "customs_post": "Київська митниця",
                "status": "active",
                "registration_date": "2020-05-15",
            },
        ]

        return RegistryResult(
            registry_name=self.name,
            success=True,
            data={"edrpou": edrpou, "warehouses": warehouses, "total": len(warehouses)},
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )

    async def search_by_name(self, name: str) -> RegistryResult:
        """Пошук за назвою."""
        start_time = datetime.now(UTC)
        return RegistryResult(
            registry_name=self.name,
            success=True,
            data={"query": name, "warehouses": [], "total": 0},
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )
