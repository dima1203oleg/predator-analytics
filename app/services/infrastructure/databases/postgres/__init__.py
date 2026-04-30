"""PostgreSQL HA Infrastructure Services (Phase 2A).

Includes: Patroni HA, PgBouncer, TimescaleDB, WAL-G, Prometheus Exporter.
"""
from functools import lru_cache

from .backup import PostgresBackupManager
from .connection_pooler import PgBouncerManager
from .extensions import PostgresExtensions
from .ha_manager import PostgresHAManager
from .monitoring import PostgresExporter


@lru_cache
def get_postgres_ha_manager() -> PostgresHAManager:
    return PostgresHAManager()


@lru_cache
def get_pgbouncer_manager() -> PgBouncerManager:
    return PgBouncerManager()


@lru_cache
def get_postgres_extensions() -> PostgresExtensions:
    return PostgresExtensions()


@lru_cache
def get_postgres_exporter() -> PostgresExporter:
    return PostgresExporter()


@lru_cache
def get_postgres_backup_manager() -> PostgresBackupManager:
    return PostgresBackupManager()


__all__ = [
    "PgBouncerManager",
    "PostgresBackupManager",
    "PostgresExporter",
    "PostgresExtensions",
    "PostgresHAManager",
    "get_pgbouncer_manager",
    "get_postgres_backup_manager",
    "get_postgres_exporter",
    "get_postgres_extensions",
    "get_postgres_ha_manager",
]
