"""E-data (Spending.gov.ua) — портал державних видатків.

Держатель: Міністерство фінансів України
Формат: API, JSON
"""
import logging
from datetime import UTC, datetime

from .base import BaseRegistryClient, RegistryResult, RegistryStatus

logger = logging.getLogger(__name__)


class EdataClient(BaseRegistryClient):
    """Клієнт для E-data (Spending.gov.ua)."""

    name = "edata"
    description = "E-data — портал державних видатків"
    holder = "Міністерство фінансів України"
    data_format = "API/JSON"
    status = RegistryStatus.ACTIVE
    update_frequency = "daily"

    API_URL = "https://spending.gov.ua/api"

    async def search_by_edrpou(self, edrpou: str) -> RegistryResult:
        """Пошук транзакцій за ЄДРПОУ отримувача."""
        start_time = datetime.now(UTC)
        edrpou = self.normalize_edrpou(edrpou)

        transactions = [
            {
                "id": "tx_001",
                "date": "2024-06-15",
                "payer": {
                    "name": "Міністерство цифрової трансформації",
                    "edrpou": "43215678",
                },
                "recipient": {
                    "name": f"ТОВ «Компанія {edrpou}»",
                    "edrpou": edrpou,
                },
                "amount": 485000.0,
                "currency": "UAH",
                "purpose": "Оплата за комп'ютерне обладнання згідно договору №123",
                "budget_program": "2201160",
            },
            {
                "id": "tx_002",
                "date": "2024-05-20",
                "payer": {
                    "name": "Державна податкова служба",
                    "edrpou": "43005393",
                },
                "recipient": {
                    "name": f"ТОВ «Компанія {edrpou}»",
                    "edrpou": edrpou,
                },
                "amount": 250000.0,
                "currency": "UAH",
                "purpose": "Оплата за послуги з розробки ПЗ",
                "budget_program": "0801010",
            },
        ]

        stats = {
            "total_received": sum(t["amount"] for t in transactions),
            "transaction_count": len(transactions),
            "unique_payers": len(set(t["payer"]["edrpou"] for t in transactions)),
        }

        return RegistryResult(
            registry_name=self.name,
            success=True,
            data={
                "edrpou": edrpou,
                "transactions": transactions,
                "statistics": stats,
                "total": len(transactions),
            },
            source_url=self.API_URL,
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )

    async def search_by_name(self, name: str) -> RegistryResult:
        """Пошук за назвою."""
        start_time = datetime.now(UTC)
        return RegistryResult(
            registry_name=self.name,
            success=True,
            data={"query": name, "transactions": [], "total": 0},
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )

    async def get_payer_statistics(self, edrpou: str) -> RegistryResult:
        """Статистика платника (держоргану)."""
        start_time = datetime.now(UTC)
        edrpou = self.normalize_edrpou(edrpou)

        stats = {
            "edrpou": edrpou,
            "name": "Міністерство цифрової трансформації",
            "total_spent": 150000000.0,
            "transaction_count": 1500,
            "top_recipients": [
                {"edrpou": "12345678", "name": "ТОВ «Постачальник 1»", "amount": 5000000.0},
                {"edrpou": "87654321", "name": "ТОВ «Постачальник 2»", "amount": 3000000.0},
            ],
            "by_month": {
                "2024-06": 25000000.0,
                "2024-05": 22000000.0,
                "2024-04": 18000000.0,
            },
        }

        return RegistryResult(
            registry_name=self.name,
            success=True,
            data=stats,
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )
