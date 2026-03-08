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
