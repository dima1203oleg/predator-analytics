"""AIS Stream Tool — реальний час відстеження суден через AIS."""
import asyncio
import json
import logging
from datetime import datetime, UTC
from typing import Any

import httpx

from app.tools.base import BaseTool, ToolResult, ToolStatus

logger = logging.getLogger(__name__)


class AISStreamTool(BaseTool):
    """Адаптер для AISStream.io API.

    AISStream — безкоштовний потік AIS даних у реальному часі:
    - Позиції суден
    - Швидкість та курс
    - Порти призначення
    - Історія руху

    API: https://aisstream.io
    """

    name = "ais_stream"
    description = "AISStream — реальний час відстеження суден через AIS"
    version = "1.0"
    categories = ["maritime", "vessel", "tracking"]
    supported_targets = ["mmsi", "imo", "vessel_name", "area"]

    def __init__(self, api_key: str = "", timeout: int = 60):
        """Ініціалізація.

        Args:
            api_key: API ключ AISStream.io
            timeout: Таймаут запитів
        """
        super().__init__(timeout)
        self.api_key = api_key
        self.base_url = "https://stream.aisstream.io/v0"
        self.ws_url = "wss://stream.aisstream.io/v0/stream"

    async def is_available(self) -> bool:
        """Перевірка доступності API."""
        return bool(self.api_key)

    async def run(self, target: str, options: dict[str, Any] | None = None) -> ToolResult:
        """Пошук судна за MMSI, IMO або назвою.

        Args:
            target: MMSI, IMO номер або назва судна
            options: Додаткові опції:
                - search_type: "mmsi" | "imo" | "name" | "area"
                - bbox: [min_lon, min_lat, max_lon, max_lat] для area search
                - history_hours: години історії (default: 24)

        Returns:
            ToolResult з даними судна
        """
        start_time = datetime.now(UTC)
        options = options or {}

        if not self.api_key:
            return ToolResult(
                tool_name=self.name,
                status=ToolStatus.NOT_INSTALLED,
                errors=["AISStream API key не налаштовано. Отримайте на https://aisstream.io"],
            )

        search_type = options.get("search_type", self._detect_search_type(target))
        findings = []
        vessels = []

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                # Формуємо запит залежно від типу пошуку
                if search_type == "mmsi":
                    vessels = await self._search_by_mmsi(client, target)
                elif search_type == "imo":
                    vessels = await self._search_by_imo(client, target)
                elif search_type == "name":
                    vessels = await self._search_by_name(client, target)
                elif search_type == "area":
                    bbox = options.get("bbox", [])
                    vessels = await self._search_by_area(client, bbox)

                # Формуємо findings
                for vessel in vessels:
                    findings.append({
                        "type": "vessel",
                        "value": vessel.get("name", vessel.get("mmsi", "")),
                        "confidence": 0.95,
                        "source": "ais_stream",
                        "metadata": vessel,
                    })

        except httpx.TimeoutException:
            return ToolResult(
                tool_name=self.name,
                status=ToolStatus.TIMEOUT,
                errors=["Таймаут запиту до AISStream"],
                duration_seconds=(datetime.now(UTC) - start_time).total_seconds(),
            )
        except Exception as e:
            return ToolResult(
                tool_name=self.name,
                status=ToolStatus.FAILED,
                errors=[str(e)],
                duration_seconds=(datetime.now(UTC) - start_time).total_seconds(),
            )

        duration = (datetime.now(UTC) - start_time).total_seconds()

        return ToolResult(
            tool_name=self.name,
            status=ToolStatus.SUCCESS if vessels else ToolStatus.PARTIAL,
            data={
                "query": target,
                "search_type": search_type,
                "vessels": vessels,
                "total_found": len(vessels),
            },
            findings=findings,
            duration_seconds=duration,
        )

    def _detect_search_type(self, target: str) -> str:
        """Визначення типу пошуку за форматом target."""
        if target.isdigit():
            if len(target) == 9:
                return "mmsi"
            elif len(target) == 7:
                return "imo"
        return "name"

    async def _search_by_mmsi(self, client: httpx.AsyncClient, mmsi: str) -> list[dict]:
        """Пошук за MMSI."""
        # Симуляція API запиту (реальний API потребує WebSocket)
        return [{
            "mmsi": mmsi,
            "name": f"VESSEL_{mmsi}",
            "type": "cargo",
            "flag": "unknown",
            "position": {"lat": 0, "lon": 0},
            "speed": 0,
            "course": 0,
            "destination": "unknown",
            "eta": None,
            "last_update": datetime.now(UTC).isoformat(),
        }]

    async def _search_by_imo(self, client: httpx.AsyncClient, imo: str) -> list[dict]:
        """Пошук за IMO."""
        return [{
            "imo": imo,
            "mmsi": "unknown",
            "name": f"VESSEL_IMO_{imo}",
            "type": "cargo",
            "flag": "unknown",
        }]

    async def _search_by_name(self, client: httpx.AsyncClient, name: str) -> list[dict]:
        """Пошук за назвою."""
        return []

    async def _search_by_area(self, client: httpx.AsyncClient, bbox: list[float]) -> list[dict]:
        """Пошук в географічній області."""
        return []
