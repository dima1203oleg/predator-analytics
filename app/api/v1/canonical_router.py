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

api_v1_router = APIRouter(prefix="/api/v1")

# Підключення канонічних модулів
api_v1_router.include_router(navigation_router, tags=["Навігація"])
api_v1_router.include_router(market_router, tags=["Ринок"])
api_v1_router.include_router(forecast_router, tags=["Прогнози"])
api_v1_router.include_router(diligence_router, tags=["Due Diligence"])
api_v1_router.include_router(copilot_router, tags=["AI Копілот"])
