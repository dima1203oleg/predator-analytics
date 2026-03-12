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
from .base import BaseTool, ToolResult, ToolStatus
from .registry import ToolRegistry, get_tool_registry

# Core OSINT
from .amass import AmassTool
from .sherlock import SherlockTool
from .harvester import TheHarvesterTool
from .exiftool import ExifToolTool
from .photon import PhotonTool
from .subfinder import SubfinderTool
from .maigret import MaigretTool

# Maritime Intelligence
from .maritime import (
    AISStreamTool,
    VesselTrackerTool,
    ContainerTrackerTool,
    PortIntelTool,
)

# Trade Intelligence
from .trade import (
    SanctionsCheckerTool,
    TradeFlowAnalyzerTool,
    OffshoreDetectorTool,
    CustomsIntelTool,
)

# Financial Intelligence
from .financial import (
    AlephTool,
    OpenOwnershipTool,
    FollowTheMoneyTool,
    OpenCorporatesTool,
    LeakSearchTool,
)

# Ukraine Registries
from .ukraine import (
    EDRTool,
    NASKTool,
    CourtRegistryTool,
    CustomsUATool,
)

# Document Analysis
from .documents import (
    TikaTool,
    LexNLPTool,
    OpenRefineTool,
)

# Social Media
from .social import (
    TwintTool,
    InstaloaderTool,
    SocialAnalyzerTool,
)

# OSINT Frameworks
from .frameworks import (
    SpiderFootTool,
    ReconNGTool,
    OsmedeusTool,
)

# Dark Web
from .darkweb import (
    OnionScanTool,
    TorBotTool,
)

# Geolocation
from .geolocation import (
    GeoIPTool,
    CreepyTool,
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
