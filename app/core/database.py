"""
Канонічний рівень роботи з БАЗОЮ ДАНИХ PREDATOR Analytics v4.1.

Використовує SQLAlchemy asyncpg pool.
Конфігурація з app.core.settings.
"""

from __future__ import annotations

from collections.abc import AsyncGenerator, Generator
from typing import Any

from sqlalchemy import NullPool
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase, declared_attr

from app.core.settings import get_settings

settings = get_settings()

# ── SQLAlchemy Core ─────────────────────────────────────────

# Відключаємо пул для Celery воркерів, якщо ENVIRONMENT == "testing"
engine_kwargs: dict[str, Any] = {
    "echo": settings.DEBUG and settings.ENVIRONMENT == "development",
    "pool_pre_ping": True,
}

if settings.ENVIRONMENT == "testing":
    engine_kwargs["poolclass"] = NullPool

engine = create_async_engine(
    settings.DATABASE_URL,
    **engine_kwargs,
)

SessionLocal = async_sessionmaker(
    bind=engine,
    autoflush=False,
    expire_on_commit=False,
)


# ── Declarative Base ─────────────────────────────────────────

class Base(DeclarativeBase):
    """
    Базовий клас для всіх моделей БД.
    З автоматичним найменуванням таблиць у нижньому регістрі.
    """

    @declared_attr.directive
    def __tablename__(cls) -> str:
        return cls.__name__.lower()


# ── Dependency ──────────────────────────────────────────────

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency: забезпечує сесію для роутів.
    
    Закривається автоматично після завершення запиту.
    """
    async with SessionLocal() as session:
        yield session


def get_db_sync() -> Generator[AsyncSession, None, None]:
     """Sync version (not recommended, but for legacy compatibility)"""
     # This is tricky with asyncpg, but for now we keep it async-only
     pass
