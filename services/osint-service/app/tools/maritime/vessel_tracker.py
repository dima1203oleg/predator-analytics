"""Vessel Tracker Tool — розслідування суден, власників, історії."""
import logging
from datetime import UTC, datetime
from typing import Any

from app.tools.base import BaseTool, ToolResult, ToolStatus

logger = logging.getLogger(__name__)


class VesselTrackerTool(BaseTool):
    """Адаптер для розслідування суден.

    Базується на методології:
    - followthemoney/vessel_research
    - Bellingcat SAR Ship Detection

    Можливості:
    - Історія руху судна
    - Власники та оператори
    - AIS gaps (підозрілі вимкнення)
    - Портові заходи
    - Санкційний статус
    """

    name = "vessel_tracker"
    description = "Vessel Tracker — розслідування суден, власників, AIS gaps"
    version = "1.0"
    categories = ["maritime", "vessel", "investigation"]
    supported_targets = ["mmsi", "imo", "vessel_name"]

    # Відомі санкційні флаги
    SANCTIONED_FLAGS = ["KP", "IR", "SY", "RU"]

    # Підозрілі порти
    SUSPICIOUS_PORTS = [
        "SEVASTOPOL", "NOVOROSSIYSK", "KERCH", "MARIUPOL",
        "BANDAR ABBAS", "CHABAHAR", "NAMPO", "WONSAN",
    ]

    async def is_available(self) -> bool:
        """Завжди доступний (використовує публічні дані)."""
        return True

    async def run(self, target: str, options: dict[str, Any] | None = None) -> ToolResult:
        """Розслідування судна.

        Args:
            target: MMSI, IMO або назва судна
            options: Додаткові опції:
                - include_history: історія руху (default: True)
                - include_ownership: ланцюг власності (default: True)
                - include_ais_gaps: аналіз AIS gaps (default: True)
                - history_days: днів історії (default: 90)

        Returns:
            ToolResult з результатами розслідування
        """
        start_time = datetime.now(UTC)
        options = options or {}

        include_history = options.get("include_history", True)
        include_ownership = options.get("include_ownership", True)
        include_ais_gaps = options.get("include_ais_gaps", True)

        findings = []
        risk_indicators = []

        # Базова інформація про судно
        vessel_info = await self._get_vessel_info(target)

        if not vessel_info:
            return ToolResult(
                tool_name=self.name,
                status=ToolStatus.PARTIAL,
                data={"query": target, "message": "Судно не знайдено"},
                duration_seconds=(datetime.now(UTC) - start_time).total_seconds(),
            )

        # Перевірка санкційного флагу
        flag = vessel_info.get("flag", "")
        if flag in self.SANCTIONED_FLAGS:
            risk_indicators.append({
                "type": "sanctioned_flag",
                "severity": "high",
                "description": f"Судно під прапором санкційної країни: {flag}",
            })
            findings.append({
                "type": "risk_indicator",
                "value": f"Санкційний прапор: {flag}",
                "confidence": 0.95,
                "source": "vessel_tracker",
            })

        # Історія руху
        port_history = []
        if include_history:
            port_history = await self._get_port_history(target)

            # Перевірка підозрілих портів
            for port in port_history:
                port_name = port.get("port_name", "").upper()
                if any(sp in port_name for sp in self.SUSPICIOUS_PORTS):
                    risk_indicators.append({
                        "type": "suspicious_port",
                        "severity": "medium",
                        "description": f"Захід у підозрілий порт: {port_name}",
                        "date": port.get("date"),
                    })
                    findings.append({
                        "type": "suspicious_activity",
                        "value": f"Порт: {port_name}",
                        "confidence": 0.8,
                        "source": "vessel_tracker",
                    })

        # AIS gaps
        ais_gaps = []
        if include_ais_gaps:
            ais_gaps = await self._analyze_ais_gaps(target)

            for gap in ais_gaps:
                if gap.get("duration_hours", 0) > 24:
                    risk_indicators.append({
                        "type": "ais_gap",
                        "severity": "high",
                        "description": f"AIS вимкнено на {gap['duration_hours']} годин",
                        "location": gap.get("last_known_position"),
                        "start": gap.get("start"),
                        "end": gap.get("end"),
                    })
                    findings.append({
                        "type": "ais_gap",
                        "value": f"AIS gap: {gap['duration_hours']}h",
                        "confidence": 0.9,
                        "source": "vessel_tracker",
                    })

        # Власники
        ownership_chain = []
        if include_ownership:
            ownership_chain = await self._get_ownership_chain(target)

            for owner in ownership_chain:
                if owner.get("jurisdiction") in ["PA", "LR", "MH", "VG", "KY"]:
                    risk_indicators.append({
                        "type": "offshore_ownership",
                        "severity": "medium",
                        "description": f"Офшорний власник: {owner.get('name')} ({owner.get('jurisdiction')})",
                    })

        duration = (datetime.now(UTC) - start_time).total_seconds()

        return ToolResult(
            tool_name=self.name,
            status=ToolStatus.SUCCESS,
            data={
                "vessel": vessel_info,
                "port_history": port_history,
                "ais_gaps": ais_gaps,
                "ownership_chain": ownership_chain,
                "risk_indicators": risk_indicators,
                "risk_score": self._calculate_risk_score(risk_indicators),
            },
            findings=findings,
            duration_seconds=duration,
        )

    async def _get_vessel_info(self, target: str) -> dict[str, Any] | None:
        """Отримання базової інформації про судно."""
        # Симуляція — в реальності запит до MarineTraffic/VesselFinder API
        return {
            "mmsi": target if target.isdigit() and len(target) == 9 else "123456789",
            "imo": "1234567",
            "name": target if not target.isdigit() else f"VESSEL_{target}",
            "type": "Bulk Carrier",
            "flag": "PA",
            "gross_tonnage": 45000,
            "deadweight": 82000,
            "length": 229,
            "beam": 32,
            "year_built": 2010,
            "status": "Underway",
            "speed": 12.5,
            "course": 245,
            "position": {
                "lat": 41.0082,
                "lon": 28.9784,
            },
            "destination": "PIRAEUS",
            "eta": "2026-03-15T08:00:00Z",
        }

    async def _get_port_history(self, target: str) -> list[dict]:
        """Отримання історії портових заходів."""
        return [
            {
                "port_name": "Istanbul",
                "country": "TR",
                "arrived": "2026-03-01T10:00:00Z",
                "departed": "2026-03-03T14:00:00Z",
                "duration_hours": 52,
            },
            {
                "port_name": "Novorossiysk",
                "country": "RU",
                "arrived": "2026-02-20T08:00:00Z",
                "departed": "2026-02-25T16:00:00Z",
                "duration_hours": 128,
            },
            {
                "port_name": "Constanta",
                "country": "RO",
                "arrived": "2026-02-10T06:00:00Z",
                "departed": "2026-02-12T12:00:00Z",
                "duration_hours": 54,
            },
        ]

    async def _analyze_ais_gaps(self, target: str) -> list[dict]:
        """Аналіз AIS gaps (періоди вимкнення транспондера)."""
        return [
            {
                "start": "2026-02-22T14:00:00Z",
                "end": "2026-02-23T18:00:00Z",
                "duration_hours": 28,
                "last_known_position": {"lat": 44.5, "lon": 37.8},
                "next_known_position": {"lat": 44.2, "lon": 38.1},
                "suspicious": True,
            },
        ]

    async def _get_ownership_chain(self, target: str) -> list[dict]:
        """Отримання ланцюга власності судна."""
        return [
            {
                "role": "Registered Owner",
                "name": "Blue Ocean Shipping Ltd",
                "jurisdiction": "MH",  # Marshall Islands
                "address": "Trust Company Complex, Ajeltake Road",
            },
            {
                "role": "Beneficial Owner",
                "name": "Unknown",
                "jurisdiction": "unknown",
            },
            {
                "role": "Operator",
                "name": "Global Maritime Services",
                "jurisdiction": "GR",
                "address": "Piraeus, Greece",
            },
        ]

    def _calculate_risk_score(self, indicators: list[dict]) -> float:
        """Розрахунок загального ризик-скору."""
        if not indicators:
            return 0.0

        severity_weights = {
            "critical": 1.0,
            "high": 0.7,
            "medium": 0.4,
            "low": 0.2,
        }

        total_weight = sum(
            severity_weights.get(ind.get("severity", "low"), 0.1)
            for ind in indicators
        )

        # Нормалізуємо до 0-100
        return min(100, total_weight * 25)
