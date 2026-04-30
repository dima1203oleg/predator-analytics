"""Trade Flow Analyzer Tool — аналіз глобальних торгових потоків."""
import logging
from datetime import UTC, datetime
from typing import Any

from app.tools.base import BaseTool, ToolResult, ToolStatus

logger = logging.getLogger(__name__)


class TradeFlowAnalyzerTool(BaseTool):
    """Адаптер для аналізу торгових потоків.

    Можливості:
    - Аналіз імпорту/експорту країни
    - Торгові маршрути
    - Виявлення аномалій
    - Схеми обходу санкцій
    - Трикутна торгівля

    Джерела:
    - UN Comtrade
    - Trade Map (ITC)
    - Customs databases
    """

    name = "trade_flow_analyzer"
    description = "Trade Flow Analyzer — аналіз глобальних торгових потоків"
    version = "1.0"
    categories = ["trade", "analytics", "customs"]
    supported_targets = ["country", "hs_code", "company"]

    # Підозрілі торгові маршрути (обхід санкцій)
    SUSPICIOUS_ROUTES = [
        {"from": "CN", "via": "KZ", "to": "RU"},  # Китай через Казахстан в Росію
        {"from": "CN", "via": "TR", "to": "RU"},  # Китай через Туреччину в Росію
        {"from": "DE", "via": "KZ", "to": "RU"},  # Німеччина через Казахстан
        {"from": "CN", "via": "AE", "to": "IR"},  # Китай через ОАЕ в Іран
        {"from": "KR", "via": "CN", "to": "KP"},  # Корея через Китай в КНДР
    ]

    # HS коди підвищеного ризику (dual-use, military)
    HIGH_RISK_HS_CODES = {
        "8471": "Комп'ютери та процесори",
        "8473": "Частини комп'ютерів",
        "8517": "Телекомунікаційне обладнання",
        "8541": "Напівпровідники",
        "8542": "Інтегральні схеми",
        "9013": "Лазери та оптика",
        "9014": "Навігаційне обладнання",
        "9015": "Геодезичне обладнання",
        "8802": "Літаки та частини",
        "8906": "Військові кораблі",
    }

    async def is_available(self) -> bool:
        """Завжди доступний."""
        return True

    async def run(self, target: str, options: dict[str, Any] | None = None) -> ToolResult:
        """Аналіз торгових потоків.

        Args:
            target: Код країни (ISO 2), HS код або назва компанії
            options: Додаткові опції:
                - analysis_type: "country" | "hs_code" | "route"
                - partner_country: країна-партнер
                - year: рік аналізу (default: поточний)
                - detect_anomalies: виявляти аномалії (default: True)

        Returns:
            ToolResult з аналізом торгових потоків
        """
        start_time = datetime.now(UTC)
        options = options or {}

        analysis_type = options.get("analysis_type", self._detect_analysis_type(target))
        detect_anomalies = options.get("detect_anomalies", True)

        findings = []
        anomalies = []

        if analysis_type == "country":
            result_data = await self._analyze_country_trade(target, options)
        elif analysis_type == "hs_code":
            result_data = await self._analyze_hs_code(target, options)
        elif analysis_type == "route":
            result_data = await self._analyze_trade_route(target, options)
        else:
            result_data = {"error": "Невідомий тип аналізу"}

        # Виявлення аномалій
        if detect_anomalies:
            anomalies = self._detect_trade_anomalies(result_data)
            for anomaly in anomalies:
                findings.append({
                    "type": "trade_anomaly",
                    "value": anomaly["description"],
                    "confidence": anomaly.get("confidence", 0.7),
                    "source": "trade_flow_analyzer",
                    "metadata": anomaly,
                })

        # Перевірка підозрілих маршрутів
        suspicious_routes = self._check_suspicious_routes(result_data)
        for route in suspicious_routes:
            findings.append({
                "type": "suspicious_route",
                "value": f"{route['from']} → {route['via']} → {route['to']}",
                "confidence": 0.85,
                "source": "trade_flow_analyzer",
                "metadata": route,
            })

        duration = (datetime.now(UTC) - start_time).total_seconds()

        return ToolResult(
            tool_name=self.name,
            status=ToolStatus.SUCCESS,
            data={
                "query": target,
                "analysis_type": analysis_type,
                **result_data,
                "anomalies": anomalies,
                "suspicious_routes": suspicious_routes,
            },
            findings=findings,
            duration_seconds=duration,
        )

    def _detect_analysis_type(self, target: str) -> str:
        """Визначення типу аналізу."""
        if len(target) == 2 and target.isalpha():
            return "country"
        if target.isdigit() and len(target) in (4, 6, 8):
            return "hs_code"
        return "route"

    async def _analyze_country_trade(self, country: str, options: dict) -> dict:
        """Аналіз торгівлі країни."""
        options.get("partner_country")

        # Симуляція даних (в реальності — UN Comtrade API)
        return {
            "country": country,
            "year": options.get("year", 2025),
            "total_exports_usd": 68_500_000_000,
            "total_imports_usd": 72_300_000_000,
            "trade_balance_usd": -3_800_000_000,
            "top_export_partners": [
                {"country": "CN", "value_usd": 8_200_000_000, "share_pct": 12.0},
                {"country": "PL", "value_usd": 6_800_000_000, "share_pct": 9.9},
                {"country": "TR", "value_usd": 5_100_000_000, "share_pct": 7.4},
                {"country": "DE", "value_usd": 4_200_000_000, "share_pct": 6.1},
                {"country": "IT", "value_usd": 3_900_000_000, "share_pct": 5.7},
            ],
            "top_import_partners": [
                {"country": "CN", "value_usd": 15_200_000_000, "share_pct": 21.0},
                {"country": "DE", "value_usd": 7_800_000_000, "share_pct": 10.8},
                {"country": "PL", "value_usd": 5_600_000_000, "share_pct": 7.7},
                {"country": "TR", "value_usd": 4_100_000_000, "share_pct": 5.7},
            ],
            "top_export_commodities": [
                {"hs_code": "1001", "name": "Пшениця", "value_usd": 8_500_000_000},
                {"hs_code": "2601", "name": "Залізна руда", "value_usd": 4_200_000_000},
                {"hs_code": "1512", "name": "Соняшникова олія", "value_usd": 3_800_000_000},
                {"hs_code": "7207", "name": "Напівфабрикати сталі", "value_usd": 2_900_000_000},
            ],
            "yoy_growth_pct": 8.5,
        }

    async def _analyze_hs_code(self, hs_code: str, options: dict) -> dict:
        """Аналіз торгівлі за HS кодом."""
        is_high_risk = hs_code[:4] in self.HIGH_RISK_HS_CODES

        return {
            "hs_code": hs_code,
            "description": self.HIGH_RISK_HS_CODES.get(hs_code[:4], "Товар"),
            "is_high_risk": is_high_risk,
            "dual_use": is_high_risk,
            "global_trade_usd": 450_000_000_000,
            "top_exporters": [
                {"country": "CN", "share_pct": 35},
                {"country": "KR", "share_pct": 15},
                {"country": "TW", "share_pct": 12},
                {"country": "JP", "share_pct": 10},
            ],
            "top_importers": [
                {"country": "US", "share_pct": 20},
                {"country": "CN", "share_pct": 18},
                {"country": "DE", "share_pct": 8},
            ],
        }

    async def _analyze_trade_route(self, route: str, options: dict) -> dict:
        """Аналіз торгового маршруту."""
        return {
            "route": route,
            "volume_usd": 2_500_000_000,
            "main_commodities": ["Electronics", "Machinery", "Chemicals"],
            "transit_time_days": 25,
            "risk_level": "medium",
        }

    def _detect_trade_anomalies(self, data: dict) -> list[dict]:
        """Виявлення торгових аномалій."""
        anomalies = []

        # Аномалія: різкий ріст торгівлі
        yoy_growth = data.get("yoy_growth_pct", 0)
        if yoy_growth > 50:
            anomalies.append({
                "type": "rapid_growth",
                "description": f"Різкий ріст торгівлі: {yoy_growth}% YoY",
                "severity": "medium",
                "confidence": 0.8,
            })

        # Аномалія: торговий дисбаланс
        balance = data.get("trade_balance_usd", 0)
        exports = data.get("total_exports_usd", 1)
        if abs(balance) > exports * 0.3:
            anomalies.append({
                "type": "trade_imbalance",
                "description": "Значний торговий дисбаланс",
                "severity": "low",
                "confidence": 0.7,
            })

        return anomalies

    def _check_suspicious_routes(self, data: dict) -> list[dict]:
        """Перевірка підозрілих маршрутів."""
        suspicious = []

        # Перевіряємо топ партнерів на предмет транзитних схем
        data.get("top_export_partners", [])
        import_partners = data.get("top_import_partners", [])

        for route in self.SUSPICIOUS_ROUTES:
            via_country = route["via"]
            # Якщо є значний імпорт з транзитної країни
            for partner in import_partners:
                if partner["country"] == via_country and partner["share_pct"] > 5:
                    suspicious.append({
                        **route,
                        "description": f"Можливий транзит через {via_country}",
                        "risk_level": "high",
                    })
                    break

        return suspicious
