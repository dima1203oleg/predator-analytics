"""
Observability API (Phase 6 — SM Edition).

Endpoints for Prometheus, Grafana, Loki, Tempo, Alertmanager.
"""
from fastapi import APIRouter
from typing import Any

from app.services.observability.observability_stack import ObservabilityStack

router = APIRouter(prefix="/observability", tags=["Observability"])

_obs = ObservabilityStack()


@router.get("/status")
async def get_observability_status() -> dict[str, Any]:
    """Стан observability stack (6GB RAM)."""
    return _obs.get_stack_status()


@router.get("/dashboards")
async def get_grafana_dashboards() -> list[dict[str, str]]:
    """Перелік Grafana dashboards."""
    return _obs.get_dashboards()


@router.get("/alerts/config")
async def get_alerts_config() -> dict[str, Any]:
    """Конфігурація Alertmanager та критичних правил."""
    return _obs.get_alerts_config()
