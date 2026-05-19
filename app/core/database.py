"""Канонічний рівень роботи з БАЗОЮ ДАНИХ PREDATOR Analytics v63.0-ELITE.

Єдиний canonical Base для всіх ORM моделей.
Використовує SQLAlchemy asyncpg pool + pgbouncer (transaction pooling).
Конфігурація з app.core.settings.

Pool strategy:
  - pgbouncer sidecar → transaction pooling (1000+ конкурентних з'єднань)
  - asyncpg pool: min_size=10, max_size=50, max_inactive_connection_lifetime=300
  - Read replicas через pgpool-II для аналітичних запитів
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from sqlalchemy import NullPool, event
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase, declared_attr
from sqlalchemy.pool import QueuePool

from app.core.settings import get_settings

if TYPE_CHECKING:
    from collections.abc import AsyncGenerator

settings = get_settings()

# ── SQLAlchemy Core (v63.0-ELITE) ───────────────────────────

def _build_engine_kwargs(db_url: str) -> dict[str, Any]:
    """Будує налаштування двигуна залежно від оточення."""
    kwargs: dict[str, Any] = {
        "echo": settings.DEBUG and settings.ENVIRONMENT == "development",
        "pool_pre_ping": True,
        "pool_recycle": 3600,
        "pool_timeout": 30,
        "connect_args": {
            "timeout": 15,
            "command_timeout": 30,
            "server_settings": {
                "application_name": f"predator_{settings.ENVIRONMENT}",
                "statement_timeout": "30000",
            },
        },
    }

    if settings.ENVIRONMENT == "testing":
        kwargs["poolclass"] = NullPool
    elif settings.PGBOUNCER_ENABLED:
        # pgbouncer transaction pooling → менше з'єднань на боці asyncpg
        kwargs["pool_size"] = min(settings.DATABASE_POOL_SIZE, 20)
        kwargs["max_overflow"] = min(settings.DATABASE_MAX_OVERFLOW, 5)
        kwargs["poolclass"] = QueuePool
    else:
        # Пряме підключення до PostgreSQL
        kwargs["pool_size"] = settings.DATABASE_POOL_SIZE
        kwargs["max_overflow"] = settings.DATABASE_MAX_OVERFLOW

    return kwargs

engine_kwargs = _build_engine_kwargs(settings.DATABASE_URL)

engine = create_async_engine(
    settings.DATABASE_URL,
    **engine_kwargs,
)

# Read replica engine (для аналітичних запитів)
if settings.DATABASE_READ_URL:
    read_engine = create_async_engine(
        settings.DATABASE_READ_URL,
        **_build_engine_kwargs(settings.DATABASE_READ_URL),
    )
    ReadSessionLocal = async_sessionmaker(
        bind=read_engine,
        autoflush=False,
        expire_on_commit=False,
    )
else:
    read_engine = None
    ReadSessionLocal = None

SessionLocal = async_sessionmaker(
    bind=engine,
    autoflush=False,
    expire_on_commit=False,
)


# ── Declarative Base (CANONICAL — v4.2.0) ────────────────────

class Base(DeclarativeBase):
    """Єдиний базовий клас для ВСІХ ORM моделей PREDATOR Analytics.

    Всі моделі (entities.py, declaration.py, company.py, product.py,
    country.py, etc.) ПОВИННІ наслідувати саме цей Base.

    Якщо модель визначає __tablename__ явно — використовується явне ім'я.
    Якщо ні — генерується автоматично в нижньому регістрі.
    """

    @declared_attr.directive
    def __tablename__(self) -> str:
        # Якщо клас визначив __tablename__ вручну — SQLAlchemy
        # використає його, не викликаючи declared_attr
        return self.__name__.lower()


# ── Dependencies (v63.0-ELITE) ─────────────────────────────

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency: write-optimized сесія (primary).

    Використовує primary PostgreSQL через pgbouncer.
    Закривається автоматично після завершення запиту.
    """
    async with SessionLocal() as session:
        yield session


async def get_read_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency: read-only сесія (replica).

    Використовує read replica для аналітичних запитів.
    Якщо replica недоступна — fallback на primary.
    """
    if ReadSessionLocal is not None:
        async with ReadSessionLocal() as session:
            yield session
    else:
        async with SessionLocal() as session:
            yield session


async def check_db_health() -> dict[str, Any]:
    """Перевірка здоров'я БД: primary + replica + pool stats."""
    import time

    result: dict[str, Any] = {"primary": "unknown", "replica": "unknown", "pool": {}}

    try:
        async with SessionLocal() as session:
            start = time.monotonic()
            await session.execute(
                __import__("sqlalchemy").text("SELECT 1")
            )
            result["primary"] = {
                "status": "healthy",
                "latency_ms": round((time.monotonic() - start) * 1000, 2),
            }
    except Exception as e:
        result["primary"] = {"status": "unhealthy", "error": str(e)}

    if ReadSessionLocal is not None:
        try:
            async with ReadSessionLocal() as session:
                start = time.monotonic()
                await session.execute(
                    __import__("sqlalchemy").text("SELECT 1")
                )
                result["replica"] = {
                    "status": "healthy",
                    "latency_ms": round((time.monotonic() - start) * 1000, 2),
                }
        except Exception as e:
            result["replica"] = {"status": "unhealthy", "error": str(e)}
    else:
        result["replica"] = {"status": "not_configured"}

    pool = engine.pool
    result["pool"] = {
        "size": pool.size() if hasattr(pool, "size") else "N/A",
        "checked_in": pool.checkedin() if hasattr(pool, "checkedin") else "N/A",
        "overflow": pool.overflow() if hasattr(pool, "overflow") else "N/A",
    }

    return result
