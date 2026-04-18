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
"""

# Експортуємо всі роутери для зручності імпорту
from .alerts import router as alerts_router
from .analytics import router as analytics_router
from .auth import router as auth_router
from .cases import router as cases_router
from .companies import router as companies_router
from .competitors import router as competitors_router
from .copilot import router as copilot_router
from .dashboard import router as dashboard_router
from .declarations import router as declarations_router
from .factory import router as factory_router
from .graph import router as graph_router
from .ingestion import router as ingestion_router
from .intelligence import router as intelligence_router
from .maritime import router as maritime_router
from .ml_studio import router as ml_studio_router
from .newspaper import router as newspaper_router
from .optimizer import router as optimizer_router
from .osint import router as osint_router
from .osint_ua import router as osint_ua_router
from .persons import router as persons_router
from .premium import router as premium_router
from .public_api import router as public_api_router
from .registries import router as registries_router
from .registries_ui import router as registries_ui_router
from .risk import router as risk_router
from .search import router as search_router
from .som import router as som_router
from .system import router as system_router
from .system import stats_router
from .antigravity import router as antigravity_router
from .agents import router as agents_router
from .warroom import router as warroom_router

__all__ = [
    "alerts_router",
    "analytics_router",
    "auth_router",
    "cases_router",
    "companies_router",
    "competitors_router",
    "copilot_router",
    "dashboard_router",
    "declarations_router",
    "factory_router",
    "graph_router",
    "ingestion_router",
    "intelligence_router",
    "maritime_router",
    "ml_studio_router",
    "newspaper_router",
    "optimizer_router",
    "osint_router",
    "osint_ua_router",
    "persons_router",
    "premium_router",
    "public_api_router",
    "registries_router",
    "registries_ui_router",
    "risk_router",
    "search_router",
    "som_router",
    "system_router",
    "stats_router",
    "antigravity_router",
    "agents_router",
    "warroom_router",
]
