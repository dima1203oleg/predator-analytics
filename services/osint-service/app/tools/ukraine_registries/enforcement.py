"""Реєстр виконавчих проваджень (АСВП).

Держатель: Міністерство юстиції України
Формат: API, XML
"""
import logging
from datetime import UTC, datetime

from .base import BaseRegistryClient, RegistryResult, RegistryStatus

logger = logging.getLogger(__name__)


class EnforcementRegistryClient(BaseRegistryClient):
    """Клієнт для Реєстру виконавчих проваджень."""

    name = "enforcement_registry"
    description = "Автоматизована система виконавчого провадження (АСВП)"
    holder = "Міністерство юстиції України"
    data_format = "API/XML"
    status = RegistryStatus.ACTIVE
    update_frequency = "daily"

    async def search_by_edrpou(self, edrpou: str) -> RegistryResult:
        """Пошук виконавчих проваджень за ЄДРПОУ."""
        start_time = datetime.now(UTC)
        edrpou = self.normalize_edrpou(edrpou)

        # Симуляція
        has_proceedings = edrpou.startswith("8")

        data = {
            "edrpou": edrpou,
            "has_proceedings": has_proceedings,
            "proceedings": [],
        }

        if has_proceedings:
            data["proceedings"] = [
                {
                    "number": "12345678",
                    "open_date": "2024-02-15",
                    "executor": "Приватний виконавець Петренко П.П.",
                    "executor_region": "Київська область",
                    "debtor_type": "legal_entity",
                    "creditor": "ТОВ «Кредитор»",
                    "amount": 250000.0,
                    "currency": "UAH",
                    "status": "active",
                    "category": "Стягнення коштів",
                },
            ]
            data["total_amount"] = sum(p["amount"] for p in data["proceedings"])
            data["active_count"] = len([p for p in data["proceedings"] if p["status"] == "active"])

        return RegistryResult(
            registry_name=self.name,
            success=True,
            data=data,
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )

    async def search_by_name(self, name: str) -> RegistryResult:
        """Пошук за назвою боржника."""
        start_time = datetime.now(UTC)
        return RegistryResult(
            registry_name=self.name,
            success=True,
            data={"results": [], "total": 0},
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )
