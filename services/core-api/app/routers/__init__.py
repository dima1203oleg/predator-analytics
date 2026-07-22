"""Predator Core API Routers Package.

Модулі роутерів організовані за функціональними доменами:
- alerts.py — Система сповіщень
- analytics.py — AML Scoring, Anomaly Detection
- auth.py — Автентифікація та авторизація
- cases.py — Управління справами
- companies.py — Робота з компаніями
- competitors.py — Аналіз конкурентів
- copilot.py — AI Copilot
- declarations.py — Митні декларації
- graph.py — Графова аналітика
- ingestion.py — Інгестія даних
- intelligence.py — Інтелектуальний аналіз
- maritime.py — AIS/ADS-B моніторинг
- optimizer.py — DSPy оптимізація промптів
- persons.py — Робота з фізособами
- public_api.py — Публічний API для партнерів
- registries.py — Українські реєстри
- risk.py — Оцінка ризиків
- search.py — Пошук
- som.py — SOM аналіз
- warroom.py — War Room
- osint_ua.py — OSINT Ukraine (DataGov, Prozorro)
- ml_studio.py — ML Studio & Training Center
- sanctions.py — Санкційний скринінг
"""

# Експортуємо всі роутери для зручності імпорту
from .adip_router import adip_router
from .admin_chaos import router as admin_chaos_router
from .admin_v2 import router as admin_v2_router
from .agents import router as agents_router
from .alerts import router as alerts_router
from .analytics import router as analytics_router
from .antigravity import router as antigravity_router
from .auth import router as auth_router
from .auto_optimizer import router as auto_optimizer_router
from .cases import router as cases_router
from .cloud_assist import router as cloud_assist_router
from .companies import router as companies_router
from .competitors import router as competitors_router
from .compliance import router as compliance_router
from .copilot import router as copilot_router
from .dashboard import router as dashboard_router
from .db_admin import router as db_admin_router

# from .decisions import router as decisions_router
from .declarations import router as declarations_router
# from .dossier import router as dossier_router
from .factory import router as factory_router
from .forecast import router as forecast_router
from .graph import router as graph_router
from .graph_intelligence import router as graph_intelligence_router
from .ingestion import router as ingestion_router
from .intelligence import router as intelligence_router
from .maritime import router as maritime_router
from .market import router as market_router
from .ml_studio import router as ml_studio_router
from .newspaper import router as newspaper_router
from .nli import router as nli_router
from .omniverse import router as omniverse_router
from .optimizer import router as optimizer_router
from .orchestrator import router as orchestrator_router
from .osint import router as osint_router
from .osint_ua import router as osint_ua_router
from .osint_vision import router as osint_vision_router
from .pae_stream import router as pae_stream_router
from .persons import router as persons_router
from .person_dossier import router as person_dossier_router
from .premium import router as premium_router
from .public_api import router as public_api_router
from .registries import router as registries_router
from .registries_ui import router as registries_ui_router
from .risk import router as risk_router
from .sanctions import router as sanctions_router
from .search import router as search_router
from .som import router as som_router

try:
    from .synthetic_data import router as synthetic_data_router
except ImportError:
    synthetic_data_router = None
from .ai import router as ai_router
from .deepseek_tuning import router as deepseek_tuning_router
from .neural import router as neural_router
from .ooda import router as ooda_router
from .open_data import router as open_data_router
from .ownership_graph import router as ownership_graph_router
from .rag import router as rag_router
from .system import router as system_router
from .system import stats_router
from .telemetry import router as telemetry_router
from .tenders import router as tenders_router
from .voice import router as voice_router
from .voice_ws import router as voice_ws_router
from .wargaming import router as wargaming_router
from .warroom import router as warroom_router
from .websocket import router as websocket_router

__all__ = [
    "admin_chaos_router",
    "admin_v2_router",
    "agents_router",
    "alerts_router",
    "analytics_router",
    "antigravity_router",
    "auth_router",
    "cases_router",
    "companies_router",
    "competitors_router",
    "compliance_router",
    "copilot_router",
    "dashboard_router",
    "db_admin_router",
    "deepseek_tuning_router",
    "ai_router",
    "neural_router",
    # "decisions_router",
    "declarations_router",
    # "dossier_router",
    "factory_router",
    "forecast_router",
    "graph_intelligence_router",
    "graph_router",
    "ingestion_router",
    "intelligence_router",
    "maritime_router",
    "market_router",
    "ml_studio_router",
    "newspaper_router",
    "nli_router",
    "optimizer_router",
    "auto_optimizer_router",
    "orchestrator_router",
    "osint_router",
    "omniverse_router",
    "osint_ua_router",
    "osint_vision_router",
    "pae_stream_router",
    "persons_router",
    "person_dossier_router",
    "premium_router",
    "public_api_router",
    "registries_router",
    "registries_ui_router",
    "risk_router",
    "sanctions_router",
    "search_router",
    "som_router",
    "synthetic_data_router",
    "stats_router",
    "system_router",
    "warroom_router",
    "wargaming_router",
    "websocket_router",
    "ai_router",
    "neural_router",
    "voice_router",
    "voice_ws_router",
    "rag_router",
    "telemetry_router",
    "ooda_router",
    "open_data_router",
    "ownership_graph_router",
    "tenders_router",
]
from .acp import router as acp_router
