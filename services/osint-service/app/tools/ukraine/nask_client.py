"""NASK Tool — НАЗК (Національне агентство з питань запобігання корупції)."""
import logging
from datetime import UTC, datetime
from typing import Any

import httpx

from app.tools.base import BaseTool, ToolResult, ToolStatus

logger = logging.getLogger(__name__)


class NASKTool(BaseTool):
    """Адаптер для НАЗК (декларації).

    НАЗК — реєстр декларацій державних службовців.
    Містить інформацію про майно, доходи, зв'язки.

    Можливості:
    - Пошук декларацій за ПІБ
    - Аналіз майна
    - Доходи та витрати
    - Корпоративні права
    - Зв'язки з компаніями

    API: https://public.nazk.gov.ua/
    """

    name = "nask_ukraine"
    description = "НАЗК — реєстр декларацій державних службовців України"
    version = "1.0"
    categories = ["ukraine", "declarations", "pep"]
    supported_targets = ["person_name", "company_name"]

    def __init__(self, timeout: int = 30):
        """Ініціалізація."""
        super().__init__(timeout)
        self.base_url = "https://public-api.nazk.gov.ua/v2"

    async def is_available(self) -> bool:
        """Перевірка доступності."""
        return True

    async def run(self, target: str, options: dict[str, Any] | None = None) -> ToolResult:
        """Пошук декларацій.

        Args:
            target: ПІБ особи або назва компанії
            options: Додаткові опції:
                - search_type: "person" | "company"
                - year: рік декларації
                - declaration_type: "annual" | "before_dismissal" | "after_dismissal"

        Returns:
            ToolResult з деклараціями
        """
        start_time = datetime.now(UTC)
        options = options or {}

        search_type = options.get("search_type", "person")
        year = options.get("year")

        findings = []
        declarations = []
        assets = []
        incomes = []

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                params = {"q": target}
                if year:
                    params["year"] = year

                response = await client.get(
                    f"{self.base_url}/declarations",
                    params=params,
                )

                if response.status_code == 200:
                    data = response.json()

                    for decl in data.get("items", []):
                        declaration = {
                            "id": decl.get("id"),
                            "person_name": decl.get("lastname", "") + " " + decl.get("firstname", ""),
                            "position": decl.get("workPost"),
                            "workplace": decl.get("workPlace"),
                            "year": decl.get("declarationYear"),
                            "type": decl.get("declarationType"),
                            "submitted_date": decl.get("submitDate"),
                        }
                        declarations.append(declaration)

                        # Аналіз майна
                        if decl.get("data"):
                            decl_data = decl["data"]

                            # Нерухомість
                            for estate in decl_data.get("step_3", {}).get("data", []):
                                assets.append({
                                    "type": "real_estate",
                                    "description": estate.get("objectType"),
                                    "area": estate.get("totalArea"),
                                    "ownership_type": estate.get("owningDate"),
                                    "declaration_id": declaration["id"],
                                })

                            # Транспорт
                            for vehicle in decl_data.get("step_6", {}).get("data", []):
                                assets.append({
                                    "type": "vehicle",
                                    "description": f"{vehicle.get('brand')} {vehicle.get('model')}",
                                    "year": vehicle.get("graduationYear"),
                                    "declaration_id": declaration["id"],
                                })

                            # Доходи
                            for income in decl_data.get("step_11", {}).get("data", []):
                                incomes.append({
                                    "type": income.get("incomeSource"),
                                    "amount": income.get("sizeIncome"),
                                    "currency": income.get("currency"),
                                    "declaration_id": declaration["id"],
                                })

                        findings.append({
                            "type": "declaration",
                            "value": declaration["person_name"],
                            "confidence": 0.95,
                            "source": "nask_ukraine",
                            "metadata": {
                                "position": declaration["position"],
                                "year": declaration["year"],
                                "workplace": declaration["workplace"],
                            },
                        })

        except httpx.TimeoutException:
            return ToolResult(
                tool_name=self.name,
                status=ToolStatus.TIMEOUT,
                errors=["Таймаут запиту до НАЗК"],
                duration_seconds=(datetime.now(UTC) - start_time).total_seconds(),
            )
        except Exception as e:
            logger.error(f"NASK error: {e}")

        # Аналіз ризиків PEP
        pep_risk = self._analyze_pep_risk(declarations, assets, incomes)

        duration = (datetime.now(UTC) - start_time).total_seconds()

        return ToolResult(
            tool_name=self.name,
            status=ToolStatus.SUCCESS if declarations else ToolStatus.PARTIAL,
            data={
                "query": target,
                "declarations": declarations,
                "assets": assets,
                "incomes": incomes,
                "total_declarations": len(declarations),
                "total_assets": len(assets),
                "pep_risk_score": pep_risk,
                "is_pep": len(declarations) > 0,
            },
            findings=findings,
            duration_seconds=duration,
        )

    def _analyze_pep_risk(
        self,
        declarations: list[dict],
        assets: list[dict],
        incomes: list[dict],
    ) -> float:
        """Аналіз ризику PEP (Politically Exposed Person)."""
        if not declarations:
            return 0.0

        score = 30.0  # Базовий score за наявність декларацій

        # Високі посади
        high_risk_positions = ["міністр", "голова", "директор", "суддя", "прокурор"]
        for decl in declarations:
            position = (decl.get("position") or "").lower()
            if any(pos in position for pos in high_risk_positions):
                score += 20

        # Багато активів
        if len(assets) > 10:
            score += 15
        elif len(assets) > 5:
            score += 10

        # Високі доходи
        total_income = sum(
            float(inc.get("amount", 0) or 0)
            for inc in incomes
            if inc.get("currency") == "UAH"
        )
        if total_income > 5_000_000:
            score += 20
        elif total_income > 1_000_000:
            score += 10

        return min(100, score)
