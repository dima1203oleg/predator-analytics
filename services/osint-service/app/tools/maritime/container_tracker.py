"""Container Tracker Tool — відстеження контейнерів та вантажів."""
import logging
from datetime import datetime, UTC
from typing import Any

import httpx

from app.tools.base import BaseTool, ToolResult, ToolStatus

logger = logging.getLogger(__name__)


class ContainerTrackerTool(BaseTool):
    """Адаптер для відстеження контейнерів.

    Можливості:
    - Пошук контейнера за номером
    - Історія переміщень
    - Поточний статус та локація
    - Зв'язок з судном та рейсом
    - Митний статус

    Джерела:
    - Container tracking APIs
    - Shipping line APIs (Maersk, MSC, CMA CGM, etc.)
    """

    name = "container_tracker"
    description = "Container Tracker — відстеження контейнерів та вантажів"
    version = "1.0"
    categories = ["maritime", "container", "logistics"]
    supported_targets = ["container_number", "bill_of_lading"]

    # Формат номера контейнера: 4 букви + 7 цифр (ISO 6346)
    CONTAINER_PATTERN = r"^[A-Z]{4}\d{7}$"

    # Основні shipping lines
    SHIPPING_LINES = {
        "MAEU": "Maersk",
        "MSCU": "MSC",
        "CMAU": "CMA CGM",
        "COSU": "COSCO",
        "EGLV": "Evergreen",
        "HLCU": "Hapag-Lloyd",
        "OOLU": "OOCL",
        "YMLU": "Yang Ming",
    }

    async def is_available(self) -> bool:
        """Завжди доступний."""
        return True

    async def run(self, target: str, options: dict[str, Any] | None = None) -> ToolResult:
        """Відстеження контейнера.

        Args:
            target: Номер контейнера (напр. MAEU1234567) або Bill of Lading
            options: Додаткові опції:
                - include_history: повна історія (default: True)
                - include_vessel: інфо про судно (default: True)

        Returns:
            ToolResult з даними контейнера
        """
        start_time = datetime.now(UTC)
        options = options or {}

        # Нормалізуємо номер контейнера
        container_number = target.upper().replace(" ", "").replace("-", "")

        findings = []

        # Визначаємо shipping line за префіксом
        prefix = container_number[:4] if len(container_number) >= 4 else ""
        shipping_line = self.SHIPPING_LINES.get(prefix, "Unknown")

        # Отримуємо дані контейнера
        container_data = await self._get_container_data(container_number)

        if not container_data:
            return ToolResult(
                tool_name=self.name,
                status=ToolStatus.PARTIAL,
                data={
                    "container_number": container_number,
                    "message": "Контейнер не знайдено",
                },
                duration_seconds=(datetime.now(UTC) - start_time).total_seconds(),
            )

        # Історія переміщень
        movement_history = []
        if options.get("include_history", True):
            movement_history = await self._get_movement_history(container_number)

        # Інформація про судно
        vessel_info = None
        if options.get("include_vessel", True) and container_data.get("current_vessel"):
            vessel_info = await self._get_vessel_info(container_data["current_vessel"])

        # Аналіз ризиків
        risk_indicators = self._analyze_risks(container_data, movement_history)

        for risk in risk_indicators:
            findings.append({
                "type": "risk_indicator",
                "value": risk["description"],
                "confidence": 0.8,
                "source": "container_tracker",
                "metadata": risk,
            })

        findings.append({
            "type": "container",
            "value": container_number,
            "confidence": 0.95,
            "source": "container_tracker",
            "metadata": {
                "shipping_line": shipping_line,
                "status": container_data.get("status"),
                "location": container_data.get("current_location"),
            },
        })

        duration = (datetime.now(UTC) - start_time).total_seconds()

        return ToolResult(
            tool_name=self.name,
            status=ToolStatus.SUCCESS,
            data={
                "container_number": container_number,
                "shipping_line": shipping_line,
                "container": container_data,
                "movement_history": movement_history,
                "vessel": vessel_info,
                "risk_indicators": risk_indicators,
            },
            findings=findings,
            duration_seconds=duration,
        )

    async def _get_container_data(self, container_number: str) -> dict[str, Any] | None:
        """Отримання даних контейнера."""
        # Симуляція — в реальності запит до shipping line API
        return {
            "container_number": container_number,
            "type": "40HC",  # 40-foot High Cube
            "status": "In Transit",
            "current_location": {
                "type": "vessel",
                "name": "MSC OSCAR",
                "position": {"lat": 36.8, "lon": 10.2},
            },
            "current_vessel": "MSC OSCAR",
            "voyage_number": "FA234E",
            "origin": {
                "port": "Shanghai",
                "country": "CN",
                "departure": "2026-02-28T10:00:00Z",
            },
            "destination": {
                "port": "Rotterdam",
                "country": "NL",
                "eta": "2026-03-25T08:00:00Z",
            },
            "shipper": "CHINA EXPORT TRADING CO",
            "consignee": "EUROPEAN IMPORTS BV",
            "commodity": "General Cargo",
            "weight_kg": 24500,
            "seal_number": "CN12345678",
        }

    async def _get_movement_history(self, container_number: str) -> list[dict]:
        """Отримання історії переміщень."""
        return [
            {
                "event": "Gate Out",
                "location": "Shanghai Yangshan Terminal",
                "timestamp": "2026-02-27T14:00:00Z",
                "vessel": None,
            },
            {
                "event": "Loaded on Vessel",
                "location": "Shanghai",
                "timestamp": "2026-02-28T10:00:00Z",
                "vessel": "MSC OSCAR",
            },
            {
                "event": "Departed",
                "location": "Shanghai",
                "timestamp": "2026-02-28T18:00:00Z",
                "vessel": "MSC OSCAR",
            },
            {
                "event": "Transshipment",
                "location": "Singapore",
                "timestamp": "2026-03-08T06:00:00Z",
                "vessel": "MSC OSCAR",
            },
            {
                "event": "In Transit",
                "location": "Mediterranean Sea",
                "timestamp": "2026-03-11T12:00:00Z",
                "vessel": "MSC OSCAR",
            },
        ]

    async def _get_vessel_info(self, vessel_name: str) -> dict[str, Any]:
        """Отримання інформації про судно."""
        return {
            "name": vessel_name,
            "imo": "9703318",
            "mmsi": "353136000",
            "flag": "PA",
            "type": "Container Ship",
            "capacity_teu": 19224,
            "operator": "MSC",
        }

    def _analyze_risks(
        self,
        container_data: dict,
        movement_history: list[dict],
    ) -> list[dict]:
        """Аналіз ризиків контейнера."""
        risks = []

        # Перевірка країни походження
        origin_country = container_data.get("origin", {}).get("country", "")
        if origin_country in ["CN", "RU", "IR", "KP"]:
            risks.append({
                "type": "high_risk_origin",
                "severity": "medium",
                "description": f"Походження з країни підвищеного ризику: {origin_country}",
            })

        # Перевірка трансшипментів
        transshipments = [m for m in movement_history if m.get("event") == "Transshipment"]
        if len(transshipments) > 2:
            risks.append({
                "type": "multiple_transshipments",
                "severity": "medium",
                "description": f"Багато трансшипментів: {len(transshipments)}",
            })

        # Перевірка опису вантажу
        commodity = container_data.get("commodity", "").lower()
        if "general" in commodity or "miscellaneous" in commodity:
            risks.append({
                "type": "vague_commodity",
                "severity": "low",
                "description": "Нечіткий опис вантажу",
            })

        return risks
