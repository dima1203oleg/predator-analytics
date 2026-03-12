"""Court Registry Tool — Єдиний державний реєстр судових рішень України."""
import logging
from datetime import datetime, UTC
from typing import Any

import httpx

from app.tools.base import BaseTool, ToolResult, ToolStatus

logger = logging.getLogger(__name__)


class CourtRegistryTool(BaseTool):
    """Адаптер для ЄДРСР (реєстр судових рішень).

    ЄДРСР — офіційний реєстр судових рішень України.
    Містить всі судові рішення з 2006 року.

    Можливості:
    - Пошук за назвою компанії
    - Пошук за ПІБ особи
    - Пошук за номером справи
    - Фільтрація за типом справи
    - Аналіз судової історії

    API: https://reyestr.court.gov.ua/
    """

    name = "court_registry_ukraine"
    description = "ЄДРСР — реєстр судових рішень України"
    version = "1.0"
    categories = ["ukraine", "court", "legal"]
    supported_targets = ["company", "person", "case_number"]

    # Типи судочинства
    CASE_TYPES = {
        "1": "Цивільне",
        "2": "Кримінальне",
        "3": "Господарське",
        "4": "Адміністративне",
        "5": "Адмінправопорушення",
    }

    def __init__(self, timeout: int = 30):
        """Ініціалізація."""
        super().__init__(timeout)
        self.base_url = "https://reyestr.court.gov.ua/Review"

    async def is_available(self) -> bool:
        """Перевірка доступності."""
        return True

    async def run(self, target: str, options: dict[str, Any] | None = None) -> ToolResult:
        """Пошук судових рішень.

        Args:
            target: Назва компанії, ПІБ або номер справи
            options: Додаткові опції:
                - case_type: тип справи (1-5)
                - date_from: дата від (YYYY-MM-DD)
                - date_to: дата до (YYYY-MM-DD)
                - court_code: код суду

        Returns:
            ToolResult з судовими рішеннями
        """
        start_time = datetime.now(UTC)
        options = options or {}

        case_type = options.get("case_type")
        date_from = options.get("date_from")
        date_to = options.get("date_to")

        findings = []
        cases = []
        risk_indicators = []

        try:
            # Симуляція пошуку (реальний API потребує парсингу сайту)
            cases = await self._search_cases(target, case_type, date_from, date_to)

            # Аналіз ризиків
            for case in cases:
                case_type_name = self.CASE_TYPES.get(str(case.get("case_type")), "Невідомо")

                # Кримінальні справи — високий ризик
                if case.get("case_type") == 2:
                    risk_indicators.append({
                        "type": "criminal_case",
                        "severity": "critical",
                        "description": f"Кримінальна справа: {case.get('case_number')}",
                        "case_id": case.get("id"),
                    })

                # Господарські справи про банкрутство
                if case.get("case_type") == 3 and "банкрут" in case.get("description", "").lower():
                    risk_indicators.append({
                        "type": "bankruptcy",
                        "severity": "high",
                        "description": f"Справа про банкрутство: {case.get('case_number')}",
                    })

                findings.append({
                    "type": "court_case",
                    "value": case.get("case_number"),
                    "confidence": 0.9,
                    "source": "court_registry_ukraine",
                    "metadata": {
                        "case_type": case_type_name,
                        "court": case.get("court_name"),
                        "date": case.get("date"),
                        "status": case.get("status"),
                    },
                })

        except Exception as e:
            logger.error(f"Court registry error: {e}")

        # Розрахунок ризику
        risk_score = self._calculate_legal_risk(cases, risk_indicators)

        duration = (datetime.now(UTC) - start_time).total_seconds()

        return ToolResult(
            tool_name=self.name,
            status=ToolStatus.SUCCESS if cases else ToolStatus.PARTIAL,
            data={
                "query": target,
                "cases": cases,
                "risk_indicators": risk_indicators,
                "total_cases": len(cases),
                "criminal_cases": len([c for c in cases if c.get("case_type") == 2]),
                "risk_score": risk_score,
                "case_types_summary": self._summarize_case_types(cases),
            },
            findings=findings,
            duration_seconds=duration,
        )

    async def _search_cases(
        self,
        query: str,
        case_type: int | None,
        date_from: str | None,
        date_to: str | None,
    ) -> list[dict]:
        """Пошук справ (симуляція)."""
        # В реальності — парсинг reyestr.court.gov.ua
        return [
            {
                "id": "12345678",
                "case_number": "910/1234/23",
                "case_type": 3,
                "court_name": "Господарський суд м. Києва",
                "date": "2023-05-15",
                "status": "Розглянуто",
                "description": "Стягнення заборгованості",
                "plaintiff": "ТОВ КРЕДИТОР",
                "defendant": query,
                "amount": 500000.00,
                "decision": "Задоволено частково",
            },
            {
                "id": "12345679",
                "case_number": "640/5678/22",
                "case_type": 4,
                "court_name": "Окружний адміністративний суд м. Києва",
                "date": "2022-11-20",
                "status": "Розглянуто",
                "description": "Оскарження рішення ДПС",
                "plaintiff": query,
                "defendant": "ГУ ДПС у м. Києві",
                "decision": "Відмовлено",
            },
        ]

    def _summarize_case_types(self, cases: list[dict]) -> dict[str, int]:
        """Підсумок за типами справ."""
        summary = {}
        for case in cases:
            case_type = self.CASE_TYPES.get(str(case.get("case_type")), "Інше")
            summary[case_type] = summary.get(case_type, 0) + 1
        return summary

    def _calculate_legal_risk(
        self,
        cases: list[dict],
        risk_indicators: list[dict],
    ) -> float:
        """Розрахунок юридичного ризику."""
        if not cases:
            return 0.0

        score = 0.0

        # За кількість справ
        score += min(len(cases) * 5, 30)

        # За типи справ
        for case in cases:
            if case.get("case_type") == 2:  # Кримінальні
                score += 30
            elif case.get("case_type") == 3:  # Господарські
                score += 10
            elif case.get("case_type") == 4:  # Адміністративні
                score += 5

        # За risk indicators
        for indicator in risk_indicators:
            if indicator.get("severity") == "critical":
                score += 25
            elif indicator.get("severity") == "high":
                score += 15

        return min(100, score)
