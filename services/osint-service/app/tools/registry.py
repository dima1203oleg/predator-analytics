"""Tool Registry — реєстр та фабрика OSINT інструментів."""
from functools import lru_cache
from typing import Any

from .base import BaseTool
from .amass import AmassTool
from .sherlock import SherlockTool
from .harvester import TheHarvesterTool
from .exiftool import ExifToolTool
from .photon import PhotonTool
from .subfinder import SubfinderTool
from .maigret import MaigretTool

# Maritime Tools
from .maritime.ais_stream import AISStreamTool
from .maritime.vessel_tracker import VesselTrackerTool
from .maritime.container_tracker import ContainerTrackerTool
from .maritime.port_intel import PortIntelTool

# Trade Intelligence Tools
from .trade.sanctions_checker import SanctionsCheckerTool
from .trade.trade_flow_analyzer import TradeFlowAnalyzerTool
from .trade.offshore_detector import OffshoreDetectorTool
from .trade.customs_intel import CustomsIntelTool

# Financial Intelligence Tools
from .financial.aleph_client import AlephTool
from .financial.open_ownership import OpenOwnershipTool
from .financial.follow_the_money import FollowTheMoneyTool
from .financial.open_corporates import OpenCorporatesTool
from .financial.leak_search import LeakSearchTool

# Ukraine Registry Tools
from .ukraine.edr_client import EDRTool
from .ukraine.nask_client import NASKTool
from .ukraine.court_registry import CourtRegistryTool
from .ukraine.customs_ua import CustomsUATool

# Document Analysis Tools
from .documents.tika_client import TikaTool
from .documents.lexnlp_client import LexNLPTool
from .documents.openrefine_client import OpenRefineTool

# Social Media Tools
from .social.twint_client import TwintTool
from .social.instaloader_client import InstaloaderTool
from .social.social_analyzer import SocialAnalyzerTool

# OSINT Frameworks
from .frameworks.spiderfoot_client import SpiderFootTool
from .frameworks.recon_ng_client import ReconNGTool
from .frameworks.osmedeus_client import OsmedeusTool

# Dark Web Tools
from .darkweb.onionscan_client import OnionScanTool
from .darkweb.torbot_client import TorBotTool

# Geolocation Tools
from .geolocation.geoip_client import GeoIPTool
from .geolocation.creepy_client import CreepyTool


class ToolRegistry:
    """Реєстр OSINT інструментів.

    Централізоване управління всіма доступними інструментами.
    """

    def __init__(self):
        """Ініціалізація реєстру."""
        self._tools: dict[str, type[BaseTool]] = {}
        self._instances: dict[str, BaseTool] = {}
        self._register_default_tools()

    def _register_default_tools(self):
        """Реєстрація стандартних інструментів."""
        default_tools = [
            # Core OSINT (7)
            AmassTool,
            SherlockTool,
            TheHarvesterTool,
            ExifToolTool,
            PhotonTool,
            SubfinderTool,
            MaigretTool,
            # Maritime Intelligence (4)
            AISStreamTool,
            VesselTrackerTool,
            ContainerTrackerTool,
            PortIntelTool,
            # Trade Intelligence (4)
            SanctionsCheckerTool,
            TradeFlowAnalyzerTool,
            OffshoreDetectorTool,
            CustomsIntelTool,
            # Financial Intelligence (5)
            AlephTool,
            OpenOwnershipTool,
            FollowTheMoneyTool,
            OpenCorporatesTool,
            LeakSearchTool,
            # Ukraine Registries (4)
            EDRTool,
            NASKTool,
            CourtRegistryTool,
            CustomsUATool,
            # Document Analysis (3)
            TikaTool,
            LexNLPTool,
            OpenRefineTool,
            # Social Media (3)
            TwintTool,
            InstaloaderTool,
            SocialAnalyzerTool,
            # OSINT Frameworks (3)
            SpiderFootTool,
            ReconNGTool,
            OsmedeusTool,
            # Dark Web (2)
            OnionScanTool,
            TorBotTool,
            # Geolocation (2)
            GeoIPTool,
            CreepyTool,
        ]

        for tool_class in default_tools:
            self.register(tool_class)

    def register(self, tool_class: type[BaseTool]):
        """Реєстрація нового інструменту.

        Args:
            tool_class: Клас інструменту
        """
        tool_name = tool_class.name
        self._tools[tool_name] = tool_class

    def get(self, name: str, timeout: int = 300) -> BaseTool | None:
        """Отримання екземпляру інструменту.

        Args:
            name: Назва інструменту
            timeout: Таймаут виконання

        Returns:
            Екземпляр інструменту або None
        """
        if name not in self._tools:
            return None

        # Кешуємо екземпляри
        cache_key = f"{name}:{timeout}"
        if cache_key not in self._instances:
            self._instances[cache_key] = self._tools[name](timeout=timeout)

        return self._instances[cache_key]

    def get_all(self) -> list[BaseTool]:
        """Отримання всіх зареєстрованих інструментів.

        Returns:
            Список екземплярів інструментів
        """
        return [self.get(name) for name in self._tools]

    def get_by_category(self, category: str) -> list[BaseTool]:
        """Отримання інструментів за категорією.

        Args:
            category: Категорія (domain, person, file, etc.)

        Returns:
            Список інструментів
        """
        result = []
        for name, tool_class in self._tools.items():
            if category in tool_class.categories:
                result.append(self.get(name))
        return result

    def get_by_target(self, target_type: str) -> list[BaseTool]:
        """Отримання інструментів за типом цілі.

        Args:
            target_type: Тип цілі (domain, username, email, file, etc.)

        Returns:
            Список інструментів
        """
        result = []
        for name, tool_class in self._tools.items():
            if target_type in tool_class.supported_targets:
                result.append(self.get(name))
        return result

    def list_tools(self) -> list[dict[str, Any]]:
        """Список всіх інструментів з метаданими.

        Returns:
            Список словників з інформацією про інструменти
        """
        return [
            {
                "name": tool_class.name,
                "description": tool_class.description,
                "version": tool_class.version,
                "categories": tool_class.categories,
                "supported_targets": tool_class.supported_targets,
            }
            for tool_class in self._tools.values()
        ]

    async def check_availability(self) -> dict[str, bool]:
        """Перевірка доступності всіх інструментів.

        Returns:
            Словник {tool_name: is_available}
        """
        result = {}
        for name in self._tools:
            tool = self.get(name)
            if tool:
                result[name] = await tool.is_available()
        return result

    @property
    def tool_names(self) -> list[str]:
        """Список назв зареєстрованих інструментів."""
        return list(self._tools.keys())


# Singleton instance
_registry: ToolRegistry | None = None


@lru_cache
def get_tool_registry() -> ToolRegistry:
    """Отримання глобального реєстру інструментів.

    Returns:
        Singleton екземпляр ToolRegistry
    """
    global _registry
    if _registry is None:
        _registry = ToolRegistry()
    return _registry
