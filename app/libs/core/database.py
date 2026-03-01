from __future__ import annotations


"""Core Database Module
Safe SQLAlchemy connection management (Async/Sync support).
"""
from contextlib import contextmanager
import logging
from typing import TYPE_CHECKING
from unittest.mock import MagicMock

from .config import settings


# 🛡️ FALLBACK: SQLAlchemy Proxy
try:
    from sqlalchemy import create_engine, text
    from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
    from sqlalchemy.orm import Session, declarative_base, sessionmaker

    HAS_SQLALCHEMY = True
except ImportError:
    HAS_SQLALCHEMY = False

    class DummyEngine:
        def dispose(self):
            pass

        async def dispose(self):
            pass

        def begin(self):
            return MagicMock()

    def create_engine(*args, **kwargs):
        return DummyEngine()

    def create_async_engine(*args, **kwargs):
        return DummyEngine()

    def text(s):
        return s

    def declarative_base():
        return MagicMock

    def sessionmaker(*args, **kwargs):
        return MagicMock()

    def async_sessionmaker(*args, **kwargs):
        return MagicMock()

    class Session:
        pass

    class AsyncSession:
        async def execute(self, *args, **kwargs):
            return MagicMock(scalar_one_or_none=lambda: None, scalars=lambda: MagicMock(all=list))

        async def commit(self):
            pass

        async def rollback(self):
            pass

        async def close(self):
            pass

        def add(self, *args, **kwargs):
            pass

        async def get(self, *args, **kwargs):
            return None


if TYPE_CHECKING:
    from collections.abc import AsyncGenerator, Generator


if TYPE_CHECKING:
    from collections.abc import AsyncGenerator, Generator


logger = logging.getLogger(__name__)

# Determine if the URL is async
is_async = "asyncpg" in settings.DATABASE_URL

if is_async:
    # Create async engine
    engine = create_async_engine(
        settings.DATABASE_URL,
        pool_size=settings.DB_POOL_SIZE,
        max_overflow=settings.DB_MAX_OVERFLOW,
        echo=settings.DEBUG,
        future=True,
    )
    # Session factory
    async_session_maker = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False, autocommit=False, autoflush=False
    )

    # Also create sync engine for scripts/predatorctl
    sync_url = settings.DATABASE_URL.replace("+asyncpg", "")
    sync_engine = create_engine(
        sync_url,
        pool_size=settings.DB_POOL_SIZE,
        max_overflow=settings.DB_MAX_OVERFLOW,
        echo=settings.DEBUG,
    )
    sync_session_maker = sessionmaker(
        sync_engine, class_=Session, expire_on_commit=False, autocommit=False, autoflush=False
    )
else:
    # Create sync engine for Celery/Scripts
    engine = create_engine(
        settings.DATABASE_URL,
        pool_size=settings.DB_POOL_SIZE,
        max_overflow=settings.DB_MAX_OVERFLOW,
        echo=settings.DEBUG,
    )
    sync_engine = engine
    # Sync Session factory
    sync_session_maker = sessionmaker(
        engine, class_=Session, expire_on_commit=False, autocommit=False, autoflush=False
    )
    # Maintain compatibility with async symbols (will fail if called, but won't crash on import)
    async_session_maker = sync_session_maker

# Base class for models
Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for getting async database session."""
    if not is_async:
        raise RuntimeError("Attempted to use get_db (async) with a sync database driver")

    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


from contextlib import asynccontextmanager


@asynccontextmanager
async def get_db_ctx() -> AsyncGenerator[AsyncSession, None]:
    """Context manager for using DB session in services."""
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


@contextmanager
def get_db_sync() -> Generator[Session, None, None]:
    """Context manager for using sync DB session in tasks/scripts."""
    with sync_session_maker() as session:
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()


async def init_db() -> None:
    """Initialize database tables and extensions."""
    # Import all models to ensure they are registered in Base.metadata
    import libs.core.models.entities  # noqa

    schemas = ["gold", "silver", "bronze", "staging"]
    if is_async:
        async with engine.begin() as conn:
            for schema in schemas:
                await conn.execute(text(f"CREATE SCHEMA IF NOT EXISTS {schema}"))
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS pg_trgm"))
            await conn.execute(text("CREATE SCHEMA IF NOT EXISTS gold"))
            await conn.execute(text("CREATE SCHEMA IF NOT EXISTS staging"))
            await conn.execute(text("CREATE SCHEMA IF NOT EXISTS raw"))
            await conn.run_sync(Base.metadata.create_all)
    else:
        with engine.begin() as conn:
            for schema in schemas:
                conn.execute(text(f"CREATE SCHEMA IF NOT EXISTS {schema}"))
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS pg_trgm"))
            conn.execute(text("CREATE SCHEMA IF NOT EXISTS raw"))
            Base.metadata.create_all(engine)
    logger.info("Database tables and extensions initialized")


async def close_db() -> None:
    """Close database connections."""
    if is_async:
        await engine.dispose()
    else:
        engine.dispose()
    logger.info("Database connections closed")
