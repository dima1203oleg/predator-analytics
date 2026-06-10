"""Customs UA Tool — Державна митна служба України."""
import logging
from datetime import UTC, datetime
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
        """Отримання митних даних через API Opendatabot."""
        from app.config import get_settings
        settings = get_settings()
        api_key = settings.OPENDATABOT_API_KEY
        
        empty_data = {
            "company": target,
            "total_import_usd": 0,
            "total_export_usd": 0,
            "declarations_count": 0,
            "countries": [],
            "hs_codes": [],
            "customs_posts": [],
            "declarations": [],
        }

        if not api_key:
            logger.warning("No OPENDATABOT_API_KEY provided, returning empty customs data")
            return empty_data

        url = f"https://opendatabot.com/api/v3/company/{target}/customs"
        headers = {"Authorization": f"Bearer {api_key}"}

        import httpx
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url, headers=headers)
                if response.status_code in (404, 403):
                    return empty_data
                response.raise_for_status()
                data = response.json()
                
            return {
                "company": target,
                "total_import_usd": data.get("total_import", 0),
                "total_export_usd": data.get("total_export", 0),
                "declarations_count": data.get("declarations_count", 0),
                "countries": data.get("countries", []),
                "hs_codes": data.get("hs_codes", []),
                "customs_posts": data.get("customs_posts", []),
                "declarations": data.get("declarations", [])[:20],
            }
        except Exception as e:
            logger.error(f"Error fetching customs data from Opendatabot: {e}")
            return empty_data

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
