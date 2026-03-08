"""
Головний роутер API v1 PREDATOR Analytics.

Підключає всі v4.1 канонічні ендпоінти.
Backward-compatible з існуючими v1 роутерами.
"""

from __future__ import annotations

from fastapi import APIRouter

from app.api.v1.navigation import router as navigation_router
from app.api.v1.market import router as market_router
from app.api.v1.forecast import router as forecast_router
from app.api.v1.diligence import router as diligence_router
from app.api.v1.copilot import router as copilot_router
from app.api.v1.health import router as health_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.search import router as search_router
from app.api.v1.competitors import router as competitors_router
from app.api.v1.risk import router as risk_router
from app.api.v1.risk import sanctions_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.warroom import router as warroom_router
from app.api.v1.graph import router as graph_router
from app.api.v1.finance import router as finance_router
from app.api.v1.commerce import router as commerce_router
from app.api.v1.counter_intel import router as counter_intel_router
from app.api.v1.self_improvement import router as self_improvement_router
from app.api.v1.smb import router as smb_router
from app.api.v1.twin import router as twin_router
from app.api.v1.agro import router as agro_router

api_v1_router = APIRouter(prefix="/api/v1")

# Підключення канонічних модулів
api_v1_router.include_router(health_router, tags=["Система"])
api_v1_router.include_router(dashboard_router, prefix="/dashboard", tags=["Дашборд"])
api_v1_router.include_router(search_router, prefix="/search", tags=["Пошук"])
api_v1_router.include_router(competitors_router, prefix="/competitors", tags=["Конкуренти"])
api_v1_router.include_router(navigation_router, tags=["Навігація"])
api_v1_router.include_router(market_router, prefix="/market", tags=["Ринок"])
api_v1_router.include_router(forecast_router, prefix="/forecast", tags=["Прогноз"])
api_v1_router.include_router(diligence_router, tags=["Due Diligence"])
api_v1_router.include_router(copilot_router, tags=["AI Копілот"])
api_v1_router.include_router(risk_router, tags=["Ризик"])
api_v1_router.include_router(sanctions_router, tags=["Санкції"])
api_v1_router.include_router(analytics_router, tags=["Аналітика"])
api_v1_router.include_router(warroom_router, tags=["Командний Центр"])
api_v1_router.include_router(graph_router, prefix="/graph", tags=["Графи"])
api_v1_router.include_router(finance_router, tags=["Фінансовий Інтелект"])
api_v1_router.include_router(commerce_router, tags=["Предиктивна Комерція"])
api_v1_router.include_router(counter_intel_router, tags=["Контррозвідка"])
api_v1_router.include_router(self_improvement_router, tags=["Самоаналіз та Розвиток"])
api_v1_router.include_router(smb_router, tags=["SMB Клієнтські Модулі"])
api_v1_router.include_router(twin_router, tags=["Digital Twin & Ontology"])
api_v1_router.include_router(agro_router, tags=["Agro-Industrial Complex (АПК)"])

