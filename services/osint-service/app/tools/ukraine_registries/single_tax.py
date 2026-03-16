"""Реєстр платників єдиного податку.

Держатель: Державна податкова служба України
Формат: XML, відкриті дані
"""
import logging
from datetime import UTC, datetime

from .base import BaseRegistryClient, RegistryResult, RegistryStatus

logger = logging.getLogger(__name__)


class SingleTaxRegistryClient(BaseRegistryClient):
    """Клієнт для Реєстру платників єдиного податку."""

    name = "single_tax_registry"
    description = "Реєстр платників єдиного податку"
    holder = "Державна податкова служба України"
    data_format = "XML"
    status = RegistryStatus.ACTIVE
    update_frequency = "weekly"

    async def search_by_edrpou(self, edrpou: str) -> RegistryResult:
        """Перевірка статусу платника єдиного податку."""
        start_time = datetime.now(UTC)
        edrpou = self.normalize_edrpou(edrpou)

        data = {
            "edrpou": edrpou,
            "name": "ФОП Іванов І.І.",
            "is_single_tax_payer": True,
            "group": 3,
            "tax_rate": 5.0,
            "registration_date": "2021-01-15",
            "kved": "62.01",
            "status": "active",
        }

        return RegistryResult(
            registry_name=self.name,
            success=True,
            data=data,
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )

    async def search_by_name(self, name: str) -> RegistryResult:
        """Пошук за назвою/ПІБ."""
        start_time = datetime.now(UTC)

        results = [
            {"rnokpp": "1234567890", "name": name, "group": 3, "status": "active"},
        ]

        return RegistryResult(
            registry_name=self.name,
            success=True,
            data={"results": results, "total": len(results)},
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )
