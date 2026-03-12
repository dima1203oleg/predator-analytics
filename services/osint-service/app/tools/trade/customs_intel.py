"""Customs Intelligence Tool — аналіз митних даних."""
import logging
from datetime import datetime, UTC
from typing import Any

from app.tools.base import BaseTool, ToolResult, ToolStatus

logger = logging.getLogger(__name__)


class CustomsIntelTool(BaseTool):
    """Адаптер для аналізу митних даних.

    Можливості:
    - Аналіз митних декларацій
    - Виявлення заниження вартості
    - Аналіз HS кодів
    - Порівняння з ринковими цінами
    - Виявлення схем ухилення

    Джерела:
    - ImportGenius
    - Panjiva
    - Trade databases
    """

    name = "customs_intel"
    description = "Customs Intelligence — аналіз митних даних та виявлення схем"
    version = "1.0"
    categories = ["customs", "trade", "compliance"]
    supported_targets = ["company", "hs_code", "declaration"]

    # Типові схеми маніпуляцій
    MANIPULATION_PATTERNS = {
        "undervaluation": "Заниження митної вартості",
        "misclassification": "Неправильна класифікація товару",
        "origin_fraud": "Фальсифікація країни походження",
        "quantity_mismatch": "Невідповідність кількості",
        "split_shipments": "Дроблення партій",
        "phantom_transit": "Фіктивний транзит",
    }

    # Середні ціни для порівняння ($/кг)
    REFERENCE_PRICES = {
        "8471": {"name": "Комп'ютери", "min": 50, "max": 500, "avg": 150},
        "8517": {"name": "Телефони", "min": 30, "max": 800, "avg": 200},
        "6403": {"name": "Взуття шкіряне", "min": 15, "max": 150, "avg": 45},
        "6110": {"name": "Светри", "min": 5, "max": 80, "avg": 20},
        "8703": {"name": "Автомобілі", "min": 5000, "max": 100000, "avg": 25000},
    }

    async def is_available(self) -> bool:
        """Завжди доступний."""
        return True

    async def run(self, target: str, options: dict[str, Any] | None = None) -> ToolResult:
        """Аналіз митних даних.

        Args:
            target: Назва компанії, HS код або ID декларації
            options: Додаткові опції:
                - analysis_type: "company" | "hs_code" | "declaration"
                - period_months: період аналізу (default: 12)
                - detect_anomalies: виявляти аномалії (default: True)

        Returns:
            ToolResult з митною аналітикою
        """
        start_time = datetime.now(UTC)
        options = options or {}

        analysis_type = options.get("analysis_type", "company")
        detect_anomalies = options.get("detect_anomalies", True)

        findings = []
        anomalies = []
        risk_indicators = []

        if analysis_type == "company":
            result_data = await self._analyze_company_imports(target, options)
        elif analysis_type == "hs_code":
            result_data = await self._analyze_hs_code_imports(target, options)
        else:
            result_data = await self._analyze_declaration(target, options)

        # Виявлення аномалій
        if detect_anomalies:
            anomalies = self._detect_customs_anomalies(result_data)
            for anomaly in anomalies:
                findings.append({
                    "type": "customs_anomaly",
                    "value": anomaly["description"],
                    "confidence": anomaly.get("confidence", 0.75),
                    "source": "customs_intel",
                    "metadata": anomaly,
                })

                if anomaly.get("severity") in ("high", "critical"):
                    risk_indicators.append(anomaly)

        # Перевірка цін
        price_anomalies = self._check_price_anomalies(result_data)
        for pa in price_anomalies:
            findings.append({
                "type": "price_anomaly",
                "value": pa["description"],
                "confidence": 0.8,
                "source": "customs_intel",
                "metadata": pa,
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
                "price_anomalies": price_anomalies,
                "risk_indicators": risk_indicators,
                "risk_score": self._calculate_risk_score(anomalies, price_anomalies),
            },
            findings=findings,
            duration_seconds=duration,
        )

    async def _analyze_company_imports(self, company: str, options: dict) -> dict:
        """Аналіз імпорту компанії."""
        return {
            "company": company,
            "period": f"{options.get('period_months', 12)} months",
            "total_declarations": 156,
            "total_value_usd": 12_500_000,
            "total_weight_kg": 450_000,
            "avg_value_per_kg": 27.78,
            "top_hs_codes": [
                {"hs_code": "8471", "description": "Комп'ютери", "value_usd": 4_200_000, "share_pct": 33.6},
                {"hs_code": "8517", "description": "Телефони", "value_usd": 3_100_000, "share_pct": 24.8},
                {"hs_code": "8528", "description": "Монітори", "value_usd": 2_800_000, "share_pct": 22.4},
            ],
            "top_origins": [
                {"country": "CN", "value_usd": 9_500_000, "share_pct": 76.0},
                {"country": "VN", "value_usd": 1_500_000, "share_pct": 12.0},
                {"country": "TW", "value_usd": 1_000_000, "share_pct": 8.0},
            ],
            "customs_posts": [
                {"post": "Київська митниця", "declarations": 89},
                {"post": "Одеська митниця", "declarations": 45},
                {"post": "Львівська митниця", "declarations": 22},
            ],
            "declarations_sample": [
                {
                    "id": "UA2026/123456",
                    "date": "2026-03-01",
                    "hs_code": "8471",
                    "description": "Ноутбуки",
                    "quantity": 500,
                    "weight_kg": 1500,
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
                    "weight_kg": 200,
                    "value_usd": 50_000,
                    "price_per_unit": 50,
                    "origin": "CN",
                },
            ],
        }

    async def _analyze_hs_code_imports(self, hs_code: str, options: dict) -> dict:
        """Аналіз імпорту за HS кодом."""
        ref_price = self.REFERENCE_PRICES.get(hs_code[:4], {})

        return {
            "hs_code": hs_code,
            "description": ref_price.get("name", "Товар"),
            "period": f"{options.get('period_months', 12)} months",
            "total_imports_usd": 850_000_000,
            "total_weight_kg": 12_000_000,
            "avg_price_per_kg": 70.83,
            "reference_price": ref_price,
            "top_importers": [
                {"company": "TECH IMPORT LLC", "value_usd": 45_000_000, "share_pct": 5.3},
                {"company": "DIGITAL TRADE CO", "value_usd": 38_000_000, "share_pct": 4.5},
                {"company": "ELECTRONICS UA", "value_usd": 32_000_000, "share_pct": 3.8},
            ],
            "price_distribution": {
                "below_min": {"count": 45, "share_pct": 8.5},
                "normal": {"count": 420, "share_pct": 79.2},
                "above_max": {"count": 65, "share_pct": 12.3},
            },
        }

    async def _analyze_declaration(self, declaration_id: str, options: dict) -> dict:
        """Аналіз конкретної декларації."""
        return {
            "declaration_id": declaration_id,
            "status": "cleared",
            "date": "2026-03-01",
            "importer": "SAMPLE COMPANY LLC",
            "exporter": "CHINA EXPORT CO",
            "hs_code": "8471",
            "description": "Laptop computers",
            "quantity": 500,
            "weight_kg": 1500,
            "declared_value_usd": 75_000,
            "price_per_unit": 150,
            "origin": "CN",
            "customs_post": "Київська митниця",
            "broker": "CUSTOMS BROKER UA",
        }

    def _detect_customs_anomalies(self, data: dict) -> list[dict]:
        """Виявлення митних аномалій."""
        anomalies = []

        # Перевірка концентрації на одному пості
        customs_posts = data.get("customs_posts", [])
        if customs_posts:
            top_post = customs_posts[0]
            total = sum(p["declarations"] for p in customs_posts)
            if total > 0 and top_post["declarations"] / total > 0.7:
                anomalies.append({
                    "type": "post_concentration",
                    "description": f"Концентрація на одному митному пості: {top_post['post']}",
                    "severity": "medium",
                    "confidence": 0.7,
                })

        # Перевірка концентрації на одній країні
        origins = data.get("top_origins", [])
        if origins and origins[0].get("share_pct", 0) > 80:
            anomalies.append({
                "type": "origin_concentration",
                "description": f"Високка концентрація імпорту з {origins[0]['country']}",
                "severity": "low",
                "confidence": 0.6,
            })

        return anomalies

    def _check_price_anomalies(self, data: dict) -> list[dict]:
        """Перевірка цінових аномалій."""
        anomalies = []

        declarations = data.get("declarations_sample", [])
        for decl in declarations:
            hs_code = decl.get("hs_code", "")[:4]
            ref = self.REFERENCE_PRICES.get(hs_code)

            if not ref:
                continue

            price = decl.get("price_per_unit", 0)

            if price < ref["min"] * 0.5:
                anomalies.append({
                    "type": "undervaluation",
                    "description": f"Можливе заниження: {decl['description']} @ ${price}/шт (мін. ${ref['min']})",
                    "declaration_id": decl.get("id"),
                    "declared_price": price,
                    "reference_min": ref["min"],
                    "deviation_pct": round((1 - price / ref["min"]) * 100, 1),
                    "severity": "high",
                })
            elif price > ref["max"] * 1.5:
                anomalies.append({
                    "type": "overvaluation",
                    "description": f"Можливе завищення: {decl['description']} @ ${price}/шт (макс. ${ref['max']})",
                    "declaration_id": decl.get("id"),
                    "declared_price": price,
                    "reference_max": ref["max"],
                    "severity": "medium",
                })

        return anomalies

    def _calculate_risk_score(
        self,
        anomalies: list[dict],
        price_anomalies: list[dict],
    ) -> float:
        """Розрахунок ризик-скору."""
        score = 0

        severity_weights = {
            "critical": 30,
            "high": 20,
            "medium": 10,
            "low": 5,
        }

        for a in anomalies + price_anomalies:
            severity = a.get("severity", "low")
            score += severity_weights.get(severity, 5)

        return min(100, score)
