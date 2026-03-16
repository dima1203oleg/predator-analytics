"""OSINT Tool Adapters.

Уніфіковані адаптери для різних OSINT інструментів.

Модулі:
- Core OSINT: Amass, Sherlock, theHarvester, ExifTool, Photon, Subfinder, Maigret
- Maritime: AIS Stream, Vessel Tracker, Container Tracker, Port Intel
- Trade: Sanctions Checker, Trade Flow Analyzer, Offshore Detector, Customs Intel
- Financial: Aleph, OpenOwnership, FollowTheMoney, OpenCorporates, LeakSearch
- Ukraine: EDR, NASK, Court Registry, Customs UA

Всього: 24 інструменти
"""
# Core OSINT
from .amass import AmassTool
from .base import BaseTool, ToolResult, ToolStatus

# Dark Web
from .darkweb import (
    OnionScanTool,
    TorBotTool,
)

# Document Analysis
from .documents import (
    LexNLPTool,
    OpenRefineTool,
    TikaTool,
)
from .exiftool import ExifToolTool

# Financial Intelligence
from .financial import (
    AlephTool,
    FollowTheMoneyTool,
    LeakSearchTool,
    OpenCorporatesTool,
    OpenOwnershipTool,
)

# OSINT Frameworks
from .frameworks import (
    OsmedeusTool,
    ReconNGTool,
    SpiderFootTool,
)

# Geolocation
from .geolocation import (
    CreepyTool,
    GeoIPTool,
)
from .harvester import TheHarvesterTool
from .maigret import MaigretTool

# Maritime Intelligence
from .maritime import (
    AISStreamTool,
    ContainerTrackerTool,
    PortIntelTool,
    VesselTrackerTool,
)
from .photon import PhotonTool
from .registry import ToolRegistry, get_tool_registry
from .sherlock import SherlockTool

# Social Media
from .social import (
    InstaloaderTool,
    SocialAnalyzerTool,
    TwintTool,
)
from .subfinder import SubfinderTool

# Trade Intelligence
from .trade import (
    CustomsIntelTool,
    OffshoreDetectorTool,
    SanctionsCheckerTool,
    TradeFlowAnalyzerTool,
)

# Ukraine Registries
from .ukraine import (
    CourtRegistryTool,
    CustomsUATool,
    EDRTool,
    NASKTool,
)

__all__ = [
    # Base
    "BaseTool",
    "ToolResult",
    "ToolStatus",
    "ToolRegistry",
    "get_tool_registry",
    # Core OSINT
    "AmassTool",
    "SherlockTool",
    "TheHarvesterTool",
    "ExifToolTool",
    "PhotonTool",
    "SubfinderTool",
    "MaigretTool",
    # Maritime
    "AISStreamTool",
    "VesselTrackerTool",
    "ContainerTrackerTool",
    "PortIntelTool",
    # Trade
    "SanctionsCheckerTool",
    "TradeFlowAnalyzerTool",
    "OffshoreDetectorTool",
    "CustomsIntelTool",
    # Financial
    "AlephTool",
    "OpenOwnershipTool",
    "FollowTheMoneyTool",
    "OpenCorporatesTool",
    "LeakSearchTool",
    # Ukraine
    "EDRTool",
    "NASKTool",
    "CourtRegistryTool",
    "CustomsUATool",
    # Documents
    "TikaTool",
    "LexNLPTool",
    "OpenRefineTool",
    # Social Media
    "TwintTool",
    "InstaloaderTool",
    "SocialAnalyzerTool",
    # OSINT Frameworks
    "SpiderFootTool",
    "ReconNGTool",
    "OsmedeusTool",
    # Dark Web
    "OnionScanTool",
    "TorBotTool",
    # Geolocation
    "GeoIPTool",
    "CreepyTool",
]
