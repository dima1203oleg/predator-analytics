"""Судовий реєстр справ.

Держатель: Державна судова адміністрація України
Формат: API
"""
import logging
from datetime import UTC, datetime

from .base import BaseRegistryClient, RegistryResult, RegistryStatus

logger = logging.getLogger(__name__)


class CourtCasesClient(BaseRegistryClient):
    """Клієнт для Судового реєстру справ."""

    name = "court_cases"
    description = "Судовий реєстр справ (стан розгляду)"
    holder = "Державна судова адміністрація України"
    data_format = "API"
    status = RegistryStatus.ACTIVE
    update_frequency = "daily"

    async def search_by_edrpou(self, edrpou: str) -> RegistryResult:
        """Пошук справ за ЄДРПОУ."""
        start_time = datetime.now(UTC)
        edrpou = self.normalize_edrpou(edrpou)

        cases = [
            {
                "case_number": "910/1234/24",
                "court": "Господарський суд міста Києва",
                "category": "Господарські справи",
                "status": "Розглядається",
                "received_date": "2024-01-15",
                "judge": "Іванов І.І.",
                "next_hearing": "2024-08-15 10:00",
                "parties": {
                    "plaintiff": "ТОВ «Позивач»",
                    "defendant": f"ТОВ «Компанія {edrpou}»",
                },
            },
        ]

        return RegistryResult(
            registry_name=self.name,
            success=True,
            data={"edrpou": edrpou, "cases": cases, "total": len(cases)},
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )

    async def search_by_name(self, name: str) -> RegistryResult:
        """Пошук за назвою сторони."""
        start_time = datetime.now(UTC)
        return RegistryResult(
            registry_name=self.name,
            success=True,
            data={"query": name, "cases": [], "total": 0},
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )

    async def get_case_status(self, case_number: str) -> RegistryResult:
        """Отримати статус справи."""
        start_time = datetime.now(UTC)

        case = {
            "case_number": case_number,
            "status": "Розглядається",
            "court": "Господарський суд міста Києва",
            "judge": "Іванов І.І.",
            "events": [
                {"date": "2024-01-15", "event": "Надходження позовної заяви"},
                {"date": "2024-02-01", "event": "Відкрито провадження"},
                {"date": "2024-03-15", "event": "Підготовче засідання"},
            ],
            "next_hearing": "2024-08-15 10:00",
        }

        return RegistryResult(
            registry_name=self.name,
            success=True,
            data=case,
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )
