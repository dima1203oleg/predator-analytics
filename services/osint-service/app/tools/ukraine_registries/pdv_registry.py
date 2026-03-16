"""Реєстр платників ПДВ.

Держатель: Державна податкова служба України
Формат: XML, відкриті дані (data.gov.ua)
Оновлення: Щотижня
"""
import logging
from datetime import UTC, datetime

from .base import BaseRegistryClient, RegistryResult, RegistryStatus

logger = logging.getLogger(__name__)


class PDVRegistryClient(BaseRegistryClient):
    """Клієнт для Реєстру платників ПДВ."""

    name = "pdv_registry"
    description = "Реєстр платників податку на додану вартість"
    holder = "Державна податкова служба України"
    data_format = "XML"
    status = RegistryStatus.ACTIVE
    update_frequency = "weekly"

    DATA_GOV_UA = "https://data.gov.ua/dataset/reestr-platnykiv-pdv"

    async def search_by_edrpou(self, edrpou: str) -> RegistryResult:
        """Перевірка статусу платника ПДВ."""
        start_time = datetime.now(UTC)
        edrpou = self.normalize_edrpou(edrpou)

        if not self.validate_edrpou(edrpou):
            return RegistryResult(
                registry_name=self.name,
                success=False,
                errors=["Невалідний код ЄДРПОУ"],
            )

        # Симуляція даних
        pdv_data = {
            "edrpou": edrpou,
            "ipn": edrpou,  # Індивідуальний податковий номер
            "name": f"ТОВ «КОМПАНІЯ {edrpou}»",
            "is_vat_payer": True,
            "registration_date": "2020-03-01",
            "registration_number": f"200000{edrpou}",
            "status": "active",
            "status_date": "2020-03-01",
            "cancellation_date": None,
            "cancellation_reason": None,
        }

        return RegistryResult(
            registry_name=self.name,
            success=True,
            data=pdv_data,
            source_url=self.DATA_GOV_UA,
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )

    async def search_by_name(self, name: str) -> RegistryResult:
        """Пошук платників ПДВ за назвою."""
        start_time = datetime.now(UTC)

        results = [
            {
                "edrpou": "12345678",
                "name": f"{name} ТОВ",
                "is_vat_payer": True,
                "registration_date": "2020-03-01",
            },
        ]

        return RegistryResult(
            registry_name=self.name,
            success=True,
            data={"results": results, "total": len(results)},
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )

    async def check_vat_status(self, edrpou: str) -> RegistryResult:
        """Швидка перевірка статусу ПДВ."""
        result = await self.search_by_edrpou(edrpou)
        if result.success:
            return RegistryResult(
                registry_name=self.name,
                success=True,
                data={
                    "edrpou": edrpou,
                    "is_vat_payer": result.data.get("is_vat_payer", False),
                    "status": result.data.get("status"),
                },
            )
        return result
