"""Реєстр боржників (ЄРБ + боржники податкової).

Держатель: Міністерство юстиції України, ДПС
Формат: XML, API
"""
import logging
from datetime import UTC, datetime

from .base import BaseRegistryClient, RegistryResult, RegistryStatus

logger = logging.getLogger(__name__)


class DebtorsRegistryClient(BaseRegistryClient):
    """Клієнт для реєстрів боржників."""

    name = "debtors_registry"
    description = "Єдиний реєстр боржників та реєстр боржників податкової"
    holder = "Міністерство юстиції України / ДПС"
    data_format = "XML/API"
    status = RegistryStatus.ACTIVE
    update_frequency = "daily"

    async def search_by_edrpou(self, edrpou: str) -> RegistryResult:
        """Перевірка наявності у реєстрі боржників."""
        start_time = datetime.now(UTC)
        edrpou = self.normalize_edrpou(edrpou)

        # Симуляція — компанія може бути боржником
        is_debtor = edrpou.startswith("9")  # Для демо

        data = {
            "edrpou": edrpou,
            "is_debtor": is_debtor,
            "debts": [],
        }

        if is_debtor:
            data["debts"] = [
                {
                    "type": "tax_debt",
                    "amount": 150000.0,
                    "currency": "UAH",
                    "creditor": "ДПС України",
                    "registration_date": "2024-01-15",
                    "status": "active",
                },
                {
                    "type": "court_debt",
                    "amount": 50000.0,
                    "currency": "UAH",
                    "creditor": "ТОВ «Кредитор»",
                    "case_number": "757/12345/24",
                    "registration_date": "2024-03-20",
                    "status": "active",
                },
            ]
            data["total_debt"] = sum(d["amount"] for d in data["debts"])
            data["risk_level"] = "high"
        else:
            data["risk_level"] = "low"

        return RegistryResult(
            registry_name=self.name,
            success=True,
            data=data,
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )

    async def search_by_name(self, name: str) -> RegistryResult:
        """Пошук боржників за назвою."""
        start_time = datetime.now(UTC)

        results = []  # Порожній для демо

        return RegistryResult(
            registry_name=self.name,
            success=True,
            data={"results": results, "total": 0},
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )

    async def get_tax_debts(self, edrpou: str) -> RegistryResult:
        """Отримати податкові борги."""
        result = await self.search_by_edrpou(edrpou)
        if result.success:
            tax_debts = [d for d in result.data.get("debts", []) if d["type"] == "tax_debt"]
            return RegistryResult(
                registry_name=self.name,
                success=True,
                data={"edrpou": edrpou, "tax_debts": tax_debts, "total": len(tax_debts)},
            )
        return result
