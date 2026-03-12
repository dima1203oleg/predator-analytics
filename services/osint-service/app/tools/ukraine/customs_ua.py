"""Customs UA Tool — Державна митна служба України."""
import logging
from datetime import datetime, UTC
from typing import Any

from app.tools.base import BaseTool, ToolResult, ToolStatus

logger = logging.getLogger(__name__)


class CustomsUATool(BaseTool):
    """Адаптер для митних даних України.

    Джерела:
    - Державна митна служба України
    - OpenDataBot митні дані
    - Import/Export statistics

    Можливості:
    - Історія імпорту/експорту компанії
    - Аналіз HS кодів
    - Країни-партнери
    - Митна вартість
    - Виявлення аномалій
    """

    name = "customs_ukraine"
    description = "Митні дані України — імпорт/експорт компаній"
    version = "1.0"
    categories = ["ukraine", "customs", "trade"]
    supported_targets = ["edrpou", "company_name"]

    # Підозрілі країни (санкції, офшори)
    SUSPICIOUS_COUNTRIES = ["RU", "BY", "IR", "KP", "VG", "KY", "PA", "BZ"]

    # HS коди підвищеного ризику
    HIGH_RISK_HS_CODES = {
        "8471": "Комп'ютери",
        "8517": "Телефони",
        "8542": "Мікросхеми",
        "2710": "Нафтопродукти",
        "7108": "Золото",
    }

    async def is_available(self) -> bool:
        """Перевірка доступності."""
        return True

    async def run(self, target: str, options: dict[str, Any] | None = None) -> ToolResult:
        """Аналіз митних даних компанії.

        Args:
            target: ЄДРПОУ або назва компанії
            options: Додаткові опції:
                - period_months: період аналізу (default: 12)
                - direction: "import" | "export" | "both"
                - detect_anomalies: виявляти аномалії (default: True)

        Returns:
            ToolResult з митними даними
        """
        start_time = datetime.now(UTC)
        options = options or {}

        period_months = options.get("period_months", 12)
        direction = options.get("direction", "both")
        detect_anomalies = options.get("detect_anomalies", True)

        findings = []
        risk_indicators = []

        # Отримуємо митні дані
        customs_data = await self._get_customs_data(target, period_months, direction)

        # Аналіз ризиків
        if detect_anomalies:
            # Підозрілі країни
            for country in customs_data.get("countries", []):
                if country["code"] in self.SUSPICIOUS_COUNTRIES:
                    risk_indicators.append({
                        "type": "suspicious_country",
                        "severity": "high",
                        "description": f"Торгівля з підозрілою країною: {country['name']}",
                        "country": country["code"],
                        "value_usd": country["value_usd"],
                    })
                    findings.append({
                        "type": "risk_indicator",
                        "value": f"Торгівля з {country['name']}",
                        "confidence": 0.9,
                        "source": "customs_ukraine",
                        "metadata": country,
                    })

            # HS коди підвищеного ризику
            for hs in customs_data.get("hs_codes", []):
                hs_prefix = hs["code"][:4]
                if hs_prefix in self.HIGH_RISK_HS_CODES:
                    risk_indicators.append({
                        "type": "high_risk_goods",
                        "severity": "medium",
                        "description": f"Товари підвищеного ризику: {self.HIGH_RISK_HS_CODES[hs_prefix]}",
                        "hs_code": hs["code"],
                    })

            # Аномалії ціни
            price_anomalies = self._detect_price_anomalies(customs_data.get("declarations", []))
            risk_indicators.extend(price_anomalies)

        # Основний finding
        findings.append({
            "type": "customs_profile",
            "value": target,
            "confidence": 0.95,
            "source": "customs_ukraine",
            "metadata": {
                "total_import_usd": customs_data.get("total_import_usd"),
                "total_export_usd": customs_data.get("total_export_usd"),
                "declarations_count": customs_data.get("declarations_count"),
            },
        })

        # Розрахунок ризику
        risk_score = self._calculate_customs_risk(customs_data, risk_indicators)

        duration = (datetime.now(UTC) - start_time).total_seconds()

        return ToolResult(
            tool_name=self.name,
            status=ToolStatus.SUCCESS,
            data={
                "query": target,
                "period_months": period_months,
                **customs_data,
                "risk_indicators": risk_indicators,
                "risk_score": risk_score,
            },
            findings=findings,
            duration_seconds=duration,
        )

    async def _get_customs_data(
        self,
        target: str,
        period_months: int,
        direction: str,
    ) -> dict[str, Any]:
        """Отримання митних даних (симуляція)."""
        # В реальності — API до OpenDataBot або власної бази
        return {
            "company": target,
            "total_import_usd": 2_500_000,
            "total_export_usd": 800_000,
            "declarations_count": 156,
            "countries": [
                {"code": "CN", "name": "Китай", "value_usd": 1_500_000, "share_pct": 60},
                {"code": "DE", "name": "Німеччина", "value_usd": 500_000, "share_pct": 20},
                {"code": "TR", "name": "Туреччина", "value_usd": 300_000, "share_pct": 12},
                {"code": "PL", "name": "Польща", "value_usd": 200_000, "share_pct": 8},
            ],
            "hs_codes": [
                {"code": "8471", "description": "Комп'ютери", "value_usd": 800_000},
                {"code": "8517", "description": "Телефони", "value_usd": 600_000},
                {"code": "6403", "description": "Взуття", "value_usd": 400_000},
            ],
            "customs_posts": [
                {"name": "Київська митниця", "declarations": 89},
                {"name": "Одеська митниця", "declarations": 45},
                {"name": "Львівська митниця", "declarations": 22},
            ],
            "declarations": [
                {
                    "id": "UA2026/123456",
                    "date": "2026-03-01",
                    "hs_code": "8471",
                    "description": "Ноутбуки",
                    "quantity": 500,
                    "value_usd": 75_000,
                    "price_per_unit": 150,
                    "origin": "CN",
                },
                {
                    "id": "UA2026/123457",
                    "date": "2026-02-28",
                    "hs_code": "8517",
                    "description": "Смартфони",
                    "quantity": 1000,
                    "value_usd": 50_000,
                    "price_per_unit": 50,
                    "origin": "CN",
                },
            ],
        }

    def _detect_price_anomalies(self, declarations: list[dict]) -> list[dict]:
        """Виявлення цінових аномалій."""
        anomalies = []

        # Референтні ціни ($/шт)
        reference_prices = {
            "8471": {"min": 100, "max": 2000},  # Ноутбуки
            "8517": {"min": 50, "max": 1500},   # Телефони
        }

        for decl in declarations:
            hs_code = decl.get("hs_code", "")[:4]
            price = decl.get("price_per_unit", 0)

            if hs_code in reference_prices:
                ref = reference_prices[hs_code]
                if price < ref["min"] * 0.5:
                    anomalies.append({
                        "type": "undervaluation",
                        "severity": "high",
                        "description": f"Заниження вартості: {decl['description']} @ ${price}/шт",
                        "declaration_id": decl.get("id"),
                        "declared_price": price,
                        "reference_min": ref["min"],
                    })

        return anomalies

    def _calculate_customs_risk(
        self,
        data: dict[str, Any],
        risk_indicators: list[dict],
    ) -> float:
        """Розрахунок митного ризику."""
        score = 0.0

        # За risk indicators
        for indicator in risk_indicators:
            if indicator.get("severity") == "critical":
                score += 30
            elif indicator.get("severity") == "high":
                score += 20
            elif indicator.get("severity") == "medium":
                score += 10

        # За концентрацію на одній країні
        countries = data.get("countries", [])
        if countries and countries[0].get("share_pct", 0) > 70:
            score += 10

        return min(100, score)
