"""Port Intelligence Tool — аналітика портів та торгових потоків."""
import logging
from datetime import UTC, datetime
from typing import Any

from app.tools.base import BaseTool, ToolResult, ToolStatus

logger = logging.getLogger(__name__)


class PortIntelTool(BaseTool):
    """Адаптер для аналітики портів.

    Можливості:
    - Інформація про порт
    - Статистика трафіку
    - Судна в порту
    - Торгові потоки
    - Санкційний аналіз
    """

    name = "port_intel"
    description = "Port Intelligence — аналітика портів та торгових потоків"
    version = "1.0"
    categories = ["maritime", "port", "trade"]
    supported_targets = ["port_code", "port_name", "country"]

    # Українські порти
    UA_PORTS = {
        "UAODS": {"name": "Odesa", "lat": 46.4825, "lon": 30.7233},
        "UAILK": {"name": "Illichivsk/Chornomorsk", "lat": 46.3, "lon": 30.65},
        "UAPVL": {"name": "Pivdennyi", "lat": 46.38, "lon": 30.75},
        "UAMKP": {"name": "Mykolaiv", "lat": 46.97, "lon": 32.0},
        "UAKHE": {"name": "Kherson", "lat": 46.63, "lon": 32.62},
        "UABRP": {"name": "Berdyansk", "lat": 46.75, "lon": 36.8},
        "UAMRP": {"name": "Mariupol", "lat": 47.1, "lon": 37.55},
    }

    # Ключові світові порти
    MAJOR_PORTS = {
        "CNSHA": {"name": "Shanghai", "country": "CN", "rank": 1},
        "SGSIN": {"name": "Singapore", "country": "SG", "rank": 2},
        "CNNGB": {"name": "Ningbo-Zhoushan", "country": "CN", "rank": 3},
        "CNSZN": {"name": "Shenzhen", "country": "CN", "rank": 4},
        "CNQIN": {"name": "Qingdao", "country": "CN", "rank": 5},
        "KRPUS": {"name": "Busan", "country": "KR", "rank": 6},
        "HKHKG": {"name": "Hong Kong", "country": "HK", "rank": 7},
        "CNTSN": {"name": "Tianjin", "country": "CN", "rank": 8},
        "NLRTM": {"name": "Rotterdam", "country": "NL", "rank": 9},
        "DEHAM": {"name": "Hamburg", "country": "DE", "rank": 10},
        "TRIST": {"name": "Istanbul", "country": "TR", "rank": 15},
        "RUSVP": {"name": "St. Petersburg", "country": "RU", "rank": 50},
        "RUNVS": {"name": "Novorossiysk", "country": "RU", "rank": 60},
    }

    # Санкційні порти
    SANCTIONED_PORTS = [
        "RUNVS",  # Novorossiysk
        "RUSEV",  # Sevastopol (окупований)
        "RUKER",  # Kerch (окупований)
        "IRBNP",  # Bandar Abbas
        "KPNAM",  # Nampo
        "KPWON",  # Wonsan
        "SYLTK",  # Latakia
    ]

    async def is_available(self) -> bool:
        """Завжди доступний."""
        return True

    async def run(self, target: str, options: dict[str, Any] | None = None) -> ToolResult:
        """Аналіз порту.

        Args:
            target: Код порту (UN/LOCODE) або назва
            options: Додаткові опції:
                - include_vessels: судна в порту (default: True)
                - include_statistics: статистика (default: True)
                - include_trade_flows: торгові потоки (default: True)

        Returns:
            ToolResult з аналітикою порту
        """
        start_time = datetime.now(UTC)
        options = options or {}

        # Нормалізуємо код порту
        port_code = target.upper().replace(" ", "")

        findings = []
        risk_indicators = []

        # Отримуємо інформацію про порт
        port_info = await self._get_port_info(port_code)

        if not port_info:
            return ToolResult(
                tool_name=self.name,
                status=ToolStatus.PARTIAL,
                data={"query": target, "message": "Порт не знайдено"},
                duration_seconds=(datetime.now(UTC) - start_time).total_seconds(),
            )

        # Перевірка санкційного статусу
        if port_code in self.SANCTIONED_PORTS:
            risk_indicators.append({
                "type": "sanctioned_port",
                "severity": "critical",
                "description": f"Порт під санкціями: {port_info['name']}",
            })
            findings.append({
                "type": "sanction",
                "value": f"Санкційний порт: {port_code}",
                "confidence": 1.0,
                "source": "port_intel",
            })

        # Судна в порту
        vessels_in_port = []
        if options.get("include_vessels", True):
            vessels_in_port = await self._get_vessels_in_port(port_code)

        # Статистика
        statistics = {}
        if options.get("include_statistics", True):
            statistics = await self._get_port_statistics(port_code)

        # Торгові потоки
        trade_flows = {}
        if options.get("include_trade_flows", True):
            trade_flows = await self._get_trade_flows(port_code)

        findings.append({
            "type": "port",
            "value": port_info["name"],
            "confidence": 0.95,
            "source": "port_intel",
            "metadata": port_info,
        })

        duration = (datetime.now(UTC) - start_time).total_seconds()

        return ToolResult(
            tool_name=self.name,
            status=ToolStatus.SUCCESS,
            data={
                "port_code": port_code,
                "port": port_info,
                "vessels_in_port": vessels_in_port,
                "statistics": statistics,
                "trade_flows": trade_flows,
                "risk_indicators": risk_indicators,
                "is_sanctioned": port_code in self.SANCTIONED_PORTS,
            },
            findings=findings,
            duration_seconds=duration,
        )

    async def _get_port_info(self, port_code: str) -> dict[str, Any] | None:
        """Отримання інформації про порт."""
        # Перевіряємо українські порти
        if port_code in self.UA_PORTS:
            port = self.UA_PORTS[port_code]
            return {
                "code": port_code,
                "name": port["name"],
                "country": "UA",
                "country_name": "Ukraine",
                "coordinates": {"lat": port["lat"], "lon": port["lon"]},
                "type": "seaport",
                "status": "operational",
            }

        # Перевіряємо світові порти
        if port_code in self.MAJOR_PORTS:
            port = self.MAJOR_PORTS[port_code]
            return {
                "code": port_code,
                "name": port["name"],
                "country": port["country"],
                "rank": port["rank"],
                "type": "seaport",
                "status": "operational",
            }

        # Пошук за назвою
        for code, port in {**self.UA_PORTS, **self.MAJOR_PORTS}.items():
            if port.get("name", "").upper() == port_code:
                return await self._get_port_info(code)

        return None

    async def _get_vessels_in_port(self, port_code: str) -> list[dict]:
        """Отримання списку суден в порту."""
        return [
            {
                "name": "BULK CARRIER ALPHA",
                "mmsi": "123456789",
                "type": "Bulk Carrier",
                "flag": "PA",
                "arrived": "2026-03-10T08:00:00Z",
                "status": "At Anchor",
            },
            {
                "name": "CONTAINER SHIP BETA",
                "mmsi": "987654321",
                "type": "Container Ship",
                "flag": "LR",
                "arrived": "2026-03-09T14:00:00Z",
                "status": "At Berth",
            },
        ]

    async def _get_port_statistics(self, port_code: str) -> dict[str, Any]:
        """Отримання статистики порту."""
        return {
            "annual_throughput_teu": 5000000,
            "annual_cargo_mt": 80000000,
            "vessel_calls_monthly": 450,
            "average_turnaround_hours": 36,
            "congestion_level": "moderate",
            "top_commodities": [
                {"name": "Grain", "share_pct": 35},
                {"name": "Iron Ore", "share_pct": 25},
                {"name": "Containers", "share_pct": 20},
                {"name": "Oil Products", "share_pct": 15},
            ],
        }

    async def _get_trade_flows(self, port_code: str) -> dict[str, Any]:
        """Отримання торгових потоків."""
        return {
            "exports": {
                "top_destinations": [
                    {"country": "CN", "share_pct": 25},
                    {"country": "TR", "share_pct": 15},
                    {"country": "EG", "share_pct": 12},
                    {"country": "IN", "share_pct": 10},
                ],
                "top_commodities": ["Grain", "Iron Ore", "Steel"],
            },
            "imports": {
                "top_origins": [
                    {"country": "CN", "share_pct": 30},
                    {"country": "DE", "share_pct": 12},
                    {"country": "TR", "share_pct": 10},
                ],
                "top_commodities": ["Machinery", "Chemicals", "Consumer Goods"],
            },
        }
