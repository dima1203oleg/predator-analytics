"""Predator v55 — Alembic env.py

Configures Alembic to:
1. Read DATABASE_URL from app.libs.core.config (sync variant)
2. Include v55 ORM models in target_metadata for autogenerate
3. Only track the 'v55' schema (ignore public/gold/silver/bronze/staging)
4. Support both online (direct DB) and offline (SQL script) modes
"""

from __future__ import annotations

import sys
from logging.config import fileConfig
from pathlib import Path

from alembic import context
from sqlalchemy import engine_from_config, pool, text

# ---------------------------------------------------------------------------
# Ensure project root is on sys.path so 'app.*' imports work
# ---------------------------------------------------------------------------
PROJECT_ROOT = str(Path(__file__).resolve().parents[3])
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

# ---------------------------------------------------------------------------
# Alembic Config object (provides access to alembic.ini values)
# ---------------------------------------------------------------------------
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# ---------------------------------------------------------------------------
# Import our ORM models so their tables register on Base.metadata
# ---------------------------------------------------------------------------
from app.libs.core.database import Base  # noqa: E402

# Import all v55 ORM models (registers tables on Base.metadata)
import app.models.v55.orm  # noqa: E402, F401

target_metadata = Base.metadata

# ---------------------------------------------------------------------------
# Set database URL from config.py (sync driver for Alembic)
# ---------------------------------------------------------------------------
from app.libs.core.config import settings  # noqa: E402

sync_url = settings.DATABASE_URL.replace("+asyncpg", "")
config.set_main_option("sqlalchemy.url", sync_url)


def include_name(name: str, type_: str, parent_names: dict) -> bool:
    """Only include objects from the 'v55' schema.

    This prevents Alembic from touching tables in public, gold, silver,
    bronze, staging, or any other schema.
    """
    if type_ == "schema":
        return name == "v55"
    return True


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode — generates SQL without a live DB."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        include_schemas=True,
        include_name=include_name,
        version_table_schema="v55",
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode — connects to the database."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        # Ensure v55 schema exists before migration
        connection.execute(text("CREATE SCHEMA IF NOT EXISTS v55"))
        connection.commit()

        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            include_schemas=True,
            include_name=include_name,
            version_table="alembic_version",
            version_table_schema="v55",
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
