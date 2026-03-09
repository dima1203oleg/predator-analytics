"""
ClickHouse Infrastructure API (Phase 2E — SM Edition).

Endpoints for ClickHouse server status and table statistics.
"""
from fastapi import APIRouter
from typing import Any

from app.services.infrastructure.databases.clickhouse.clickhouse_manager import ClickHouseInfraManager

router = APIRouter(prefix="/infra/db/clickhouse", tags=["Infrastructure & Databases"])

_mgr = ClickHouseInfraManager()


@router.get("/status")
async def get_clickhouse_status() -> dict[str, Any]:
    """Стан ClickHouse."""
    return _mgr.get_server_status()


@router.get("/tables")
async def list_clickhouse_tables() -> list[dict[str, str]]:
    """Перелік ClickHouse таблиць."""
    return _mgr.list_tables()


@router.get("/tables/{table_name}")
async def get_table_stats(table_name: str) -> dict[str, Any]:
    """Статистика таблиці."""
    return _mgr.get_table_stats(table_name)
