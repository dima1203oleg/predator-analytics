"""PostgreSQL HA Infrastructure API (Phase 2A — SM Edition).

Endpoints for managing PostgreSQL HA cluster, PgBouncer,
TimescaleDB extensions, WAL-G backups, and Prometheus exporter.
"""
from typing import Any

from fastapi import APIRouter, Depends

from app.services.infrastructure.databases.postgres import (
    PgBouncerManager,
    PostgresBackupManager,
    PostgresExporter,
    PostgresExtensions,
    PostgresHAManager,
    get_pgbouncer_manager,
    get_postgres_backup_manager,
    get_postgres_exporter,
    get_postgres_extensions,
    get_postgres_ha_manager,
)

router = APIRouter(prefix="/infra/db/postgres", tags=["Infrastructure & Databases"])


# --- Patroni HA ---

@router.get("/health")
async def get_postgres_ha_health(
    manager: PostgresHAManager = Depends(get_postgres_ha_manager),
) -> dict[str, Any]:
    """Стан PostgreSQL HA кластера (Patroni)."""
    return manager.get_cluster_health()


@router.post("/failover")
async def manual_postgres_failover(
    manager: PostgresHAManager = Depends(get_postgres_ha_manager),
) -> dict[str, Any]:
    """Ручний failover PostgreSQL."""
    return manager.trigger_failover()


# --- PgBouncer (SM-023) ---

@router.get("/pgbouncer/stats")
async def get_pgbouncer_stats(
    mgr: PgBouncerManager = Depends(get_pgbouncer_manager),
) -> dict[str, Any]:
    """Статистика PgBouncer connection pooler."""
    return mgr.get_pool_stats()


@router.post("/pgbouncer/reload")
async def reload_pgbouncer(
    mgr: PgBouncerManager = Depends(get_pgbouncer_manager),
) -> dict[str, str]:
    """Перезавантажити конфігурацію PgBouncer."""
    return mgr.reload_config()


# --- TimescaleDB (SM-024) ---

@router.get("/extensions/timescaledb")
async def get_timescaledb_status(
    ext: PostgresExtensions = Depends(get_postgres_extensions),
) -> dict[str, Any]:
    """Стан TimescaleDB extension."""
    return ext.get_timescaledb_status()


@router.get("/extensions")
async def list_extensions(
    ext: PostgresExtensions = Depends(get_postgres_extensions),
) -> list[str]:
    """Список встановлених PostgreSQL extensions."""
    return ext.list_installed_extensions()


# --- Prometheus Exporter (SM-025) ---

@router.get("/exporter/status")
async def get_exporter_status(
    exp: PostgresExporter = Depends(get_postgres_exporter),
) -> dict[str, Any]:
    """Стан Prometheus exporter для PostgreSQL."""
    return exp.get_metrics_status()


# --- WAL-G Backups (SM-026) ---

@router.get("/backup/status")
async def get_backup_status(
    bkp: PostgresBackupManager = Depends(get_postgres_backup_manager),
) -> dict[str, Any]:
    """Стан WAL-G безперервного архівування."""
    return bkp.get_backup_status()


@router.post("/backup/trigger")
async def trigger_base_backup(
    bkp: PostgresBackupManager = Depends(get_postgres_backup_manager),
) -> dict[str, str]:
    """Запустити ручний base backup через WAL-G."""
    return bkp.trigger_base_backup()


# --- Schema v55.3 (SM-027) ---

from app.services.infrastructure.databases.postgres.schema_v553 import SchemaManager

_schema = SchemaManager()


@router.get("/schema/info")
async def get_schema_info() -> dict[str, Any]:
    """Інформація про PostgreSQL v55.3 схему."""
    return _schema.get_schema_info()


@router.get("/schema/migration")
async def get_migration_sql() -> dict[str, str]:
    """SQL міграція для створення v55.3 схеми."""
    return {"sql": _schema.get_migration_sql()}

