"""Єдиний державний реєстр судових рішень (ЄДРСР).

Держатель: Державна судова адміністрація України
Формат: API (обмежений), HTML scraping
Статус: Частково закритий під час війни
"""
import logging
from datetime import UTC, datetime

from .base import BaseRegistryClient, RegistryResult, RegistryStatus

logger = logging.getLogger(__name__)


class CourtDecisionsClient(BaseRegistryClient):
    """Клієнт для ЄДРСР."""

    name = "court_decisions"
    description = "Єдиний державний реєстр судових рішень"
    holder = "Державна судова адміністрація України"
    data_format = "API/HTML"
    status = RegistryStatus.LIMITED  # Обмежений під час війни
    update_frequency = "daily"

    REYESTR_URL = "https://reyestr.court.gov.ua"

    async def search_by_edrpou(self, edrpou: str) -> RegistryResult:
        """Пошук судових рішень за ЄДРПОУ."""
        start_time = datetime.now(UTC)
        edrpou = self.normalize_edrpou(edrpou)

        # Симуляція судових рішень
        decisions = [
            {
                "id": "12345678",
                "case_number": "910/1234/24",
                "court": "Господарський суд міста Києва",
                "judge": "Іванов І.І.",
                "decision_date": "2024-06-15",
                "decision_type": "Рішення",
                "category": "Господарські справи",
                "parties": {
                    "plaintiff": "ТОВ «Позивач»",
                    "defendant": f"ТОВ «Компанія {edrpou}»",
                },
                "amount": 500000.0,
                "result": "Задоволено частково",
                "url": f"{self.REYESTR_URL}/Review/12345678",
            },
            {
                "id": "87654321",
                "case_number": "757/5678/23",
                "court": "Київський апеляційний суд",
                "judge": "Петренко П.П.",
                "decision_date": "2023-12-20",
                "decision_type": "Постанова",
                "category": "Цивільні справи",
                "parties": {
                    "plaintiff": f"ТОВ «Компанія {edrpou}»",
                    "defendant": "Фізична особа",
                },
                "amount": 100000.0,
                "result": "Задоволено",
                "url": f"{self.REYESTR_URL}/Review/87654321",
            },
        ]

        return RegistryResult(
            registry_name=self.name,
            success=True,
            data={
                "edrpou": edrpou,
                "decisions": decisions,
                "total": len(decisions),
                "as_plaintiff": len([d for d in decisions if edrpou in str(d["parties"].get("plaintiff", ""))]),
                "as_defendant": len([d for d in decisions if edrpou in str(d["parties"].get("defendant", ""))]),
            },
            warnings=["Реєстр працює з обмеженнями під час воєнного стану"],
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )

    async def search_by_name(self, name: str) -> RegistryResult:
        """Пошук за назвою сторони."""
        start_time = datetime.now(UTC)

        decisions = [
            {
                "id": "11111111",
                "case_number": "910/9999/24",
                "court": "Господарський суд міста Києва",
                "decision_date": "2024-05-10",
                "decision_type": "Ухвала",
                "parties": {"plaintiff": name, "defendant": "ТОВ «Відповідач»"},
            },
        ]

        return RegistryResult(
            registry_name=self.name,
            success=True,
            data={"query": name, "decisions": decisions, "total": len(decisions)},
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )

    async def search_by_case_number(self, case_number: str) -> RegistryResult:
        """Пошук за номером справи."""
        start_time = datetime.now(UTC)

        decision = {
            "id": "99999999",
            "case_number": case_number,
            "court": "Господарський суд міста Києва",
            "judge": "Сидоренко С.С.",
            "decision_date": "2024-07-01",
            "decision_type": "Рішення",
            "full_text": "Текст рішення...",
            "url": f"{self.REYESTR_URL}/Review/99999999",
        }

        return RegistryResult(
            registry_name=self.name,
            success=True,
            data=decision,
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )
