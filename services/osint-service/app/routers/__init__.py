"""OSINT API Routers."""
from .company import router as company_router
from .darkweb import router as darkweb_router
from .documents import router as documents_router
from .domain import router as domain_router
from .file import router as file_router
from .financial import router as financial_router
from .frameworks import router as frameworks_router
from .geolocation import router as geolocation_router
from .maritime import router as maritime_router
from .osint_2_0 import router as osint_2_0_router
from .person import router as person_router
from .social import router as social_router
from .tools import router as tools_router
from .trade import router as trade_router
from .ukraine import router as ukraine_router
from .ukraine_registries import router as ukraine_registries_router

__all__ = [
    "domain_router",
    "person_router",
    "company_router",
    "file_router",
    "tools_router",
    "maritime_router",
    "trade_router",
    "financial_router",
    "ukraine_router",
    "documents_router",
    "social_router",
    "frameworks_router",
    "darkweb_router",
    "geolocation_router",
    "ukraine_registries_router",
    "osint_2_0_router",
]
