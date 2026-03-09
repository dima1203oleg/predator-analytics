"""
PostgreSQL HA Infrastructure Services (Phase 2A).

Includes: Patroni HA, PgBouncer, TimescaleDB, WAL-G, Prometheus Exporter.
"""
from functools import lru_cache

from .ha_manager import PostgresHAManager
from .connection_pooler import PgBouncerManager
from .extensions import PostgresExtensions
from .monitoring import PostgresExporter
from .backup import PostgresBackupManager


@lru_cache()
def get_postgres_ha_manager() -> PostgresHAManager:
    return PostgresHAManager()


@lru_cache()
def get_pgbouncer_manager() -> PgBouncerManager:
    return PgBouncerManager()


@lru_cache()
def get_postgres_extensions() -> PostgresExtensions:
    return PostgresExtensions()


@lru_cache()
def get_postgres_exporter() -> PostgresExporter:
    return PostgresExporter()


@lru_cache()
def get_postgres_backup_manager() -> PostgresBackupManager:
    return PostgresBackupManager()


__all__ = [
    "PostgresHAManager", "get_postgres_ha_manager",
    "PgBouncerManager", "get_pgbouncer_manager",
    "PostgresExtensions", "get_postgres_extensions",
    "PostgresExporter", "get_postgres_exporter",
    "PostgresBackupManager", "get_postgres_backup_manager",
]
