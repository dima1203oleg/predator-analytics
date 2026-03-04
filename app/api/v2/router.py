"""Predator v55.0 — API v2 Router aggregator.

Mounts all v2 sub-routers under /api/v2.
v1 routers remain untouched (Strangler Fig pattern).
"""

from fastapi import APIRouter

from app.api.v2.analytics import router as analytics_router
from app.api.v2.decisions import router as decisions_router
from app.api.v2.entities import router as entities_router
from app.api.v2.ingestion import router as ingestion_router
from app.api.v2.pipeline import router as pipeline_router
from app.api.v2.signals import router as signals_router


v2_router = APIRouter(prefix="/api/v2")

v2_router.include_router(entities_router)
v2_router.include_router(analytics_router)
v2_router.include_router(signals_router)
v2_router.include_router(decisions_router)
v2_router.include_router(pipeline_router)
v2_router.include_router(ingestion_router)
