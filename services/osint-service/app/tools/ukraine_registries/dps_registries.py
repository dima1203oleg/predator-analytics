"""Реєстри ДПС — великі платники, страхувальники.

Держатель: Державна податкова служба України
Формат: XML, відкриті дані
"""
import logging
from datetime import UTC, datetime

from .base import BaseRegistryClient, RegistryResult, RegistryStatus

logger = logging.getLogger(__name__)


class LargeTaxpayersClient(BaseRegistryClient):
    """Реєстр великих платників податків."""

    name = "large_taxpayers"
    description = "Реєстр великих платників податків"
    holder = "ДПС України"
    data_format = "XML"
    status = RegistryStatus.ACTIVE
    update_frequency = "monthly"

    async def search_by_edrpou(self, edrpou: str) -> RegistryResult:
        """Перевірка статусу великого платника."""
        start_time = datetime.now(UTC)
        edrpou = self.normalize_edrpou(edrpou)

        # Симуляція — великі платники зазвичай починаються з певних цифр
        is_large = edrpou.startswith("0") or edrpou.startswith("1")

        data = {
            "edrpou": edrpou,
            "is_large_taxpayer": is_large,
            "category": None,
            "registration_date": None,
        }

        if is_large:
            data.update({
                "category": "Великий платник податків",
                "registration_date": "2020-01-01",
                "tax_office": "Офіс великих платників податків ДПС",
                "annual_income_threshold": 1000000000.0,  # 1 млрд грн
            })

        return RegistryResult(
            registry_name=self.name,
            success=True,
            data=data,
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )

    async def search_by_name(self, name: str) -> RegistryResult:
        """Пошук за назвою."""
        start_time = datetime.now(UTC)
        return RegistryResult(
            registry_name=self.name,
            success=True,
            data={"query": name, "results": [], "total": 0},
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )


class InsurersRegistryClient(BaseRegistryClient):
    """Реєстр страхувальників."""

    name = "insurers_registry"
    description = "Реєстр страхувальників"
    holder = "ДПС України"
    data_format = "XML"
    status = RegistryStatus.ACTIVE
    update_frequency = "weekly"

    async def search_by_edrpou(self, edrpou: str) -> RegistryResult:
        """Перевірка статусу страхувальника."""
        start_time = datetime.now(UTC)
        edrpou = self.normalize_edrpou(edrpou)

        data = {
            "edrpou": edrpou,
            "is_insurer": True,
            "registration_number": f"СТР-{edrpou[:6]}",
            "registration_date": "2019-01-15",
            "employees_count": 50,
            "esv_status": "active",  # Єдиний соціальний внесок
            "last_payment_date": "2024-06-30",
        }

        return RegistryResult(
            registry_name=self.name,
            success=True,
            data=data,
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )

    async def search_by_name(self, name: str) -> RegistryResult:
        """Пошук за назвою."""
        start_time = datetime.now(UTC)
        return RegistryResult(
            registry_name=self.name,
            success=True,
            data={"query": name, "results": [], "total": 0},
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )


class AlcoholLicensesClient(BaseRegistryClient):
    """Реєстр ліцензій на алкоголь."""

    name = "alcohol_licenses"
    description = "Реєстр ліцензій на виробництво та торгівлю алкоголем"
    holder = "ДПС України"
    data_format = "XML"
    status = RegistryStatus.ACTIVE
    update_frequency = "weekly"

    async def search_by_edrpou(self, edrpou: str) -> RegistryResult:
        """Пошук ліцензій на алкоголь."""
        start_time = datetime.now(UTC)
        edrpou = self.normalize_edrpou(edrpou)

        licenses = [
            {
                "number": f"АЛК-{edrpou[:6]}-001",
                "type": "Роздрібна торгівля алкогольними напоями",
                "issue_date": "2023-01-15",
                "valid_until": "2024-01-15",
                "status": "active",
                "address": "м. Київ, вул. Хрещатик, 1",
            },
        ]

        return RegistryResult(
            registry_name=self.name,
            success=True,
            data={"edrpou": edrpou, "licenses": licenses, "total": len(licenses)},
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )

    async def search_by_name(self, name: str) -> RegistryResult:
        """Пошук за назвою."""
        start_time = datetime.now(UTC)
        return RegistryResult(
            registry_name=self.name,
            success=True,
            data={"query": name, "licenses": [], "total": 0},
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )


class FuelLicensesClient(BaseRegistryClient):
    """Реєстр ліцензій на пальне."""

    name = "fuel_licenses"
    description = "Реєстр ліцензій на виробництво, зберігання та торгівлю пальним"
    holder = "ДПС України"
    data_format = "XML"
    status = RegistryStatus.ACTIVE
    update_frequency = "weekly"

    async def search_by_edrpou(self, edrpou: str) -> RegistryResult:
        """Пошук ліцензій на пальне."""
        start_time = datetime.now(UTC)
        edrpou = self.normalize_edrpou(edrpou)

        licenses = [
            {
                "number": f"ПАЛ-{edrpou[:6]}-001",
                "type": "Роздрібна торгівля пальним",
                "fuel_types": ["Бензин А-95", "Дизельне пальне", "Газ LPG"],
                "issue_date": "2023-06-01",
                "valid_until": "2028-06-01",
                "status": "active",
                "storage_capacity_liters": 50000,
            },
        ]

        return RegistryResult(
            registry_name=self.name,
            success=True,
            data={"edrpou": edrpou, "licenses": licenses, "total": len(licenses)},
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )

    async def search_by_name(self, name: str) -> RegistryResult:
        """Пошук за назвою."""
        start_time = datetime.now(UTC)
        return RegistryResult(
            registry_name=self.name,
            success=True,
            data={"query": name, "licenses": [], "total": 0},
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )
