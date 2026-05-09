"""Канонічний рівень роботи з БАЗОЮ ДАНИХ PREDATOR Analytics v4.2.0.

Єдиний canonical Base для всіх ORM моделей.
Використовує SQLAlchemy asyncpg pool.
Конфігурація з app.core.settings.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from sqlalchemy import NullPool
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase, declared_attr

from app.core.settings import get_settings

if TYPE_CHECKING:
    from collections.abc import AsyncGenerator

settings = get_settings()

# ── SQLAlchemy Core ─────────────────────────────────────────

# Налаштування двигуна (HR-17/18)
engine_kwargs: dict[str, Any] = {
    "echo": settings.DEBUG and settings.ENVIRONMENT == "development",
    "pool_pre_ping": True,
    "pool_size": 20,           # Оптимально для ELITE навантаження
    "max_overflow": 10,        # Додаткові з'єднання при піках
    "pool_recycle": 3600,      # Оновлювати з'єднання щогодини
    "pool_timeout": 30,        # Тайм-аут очікування з'єднання
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


# ── Dependency ──────────────────────────────────────────────

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency: забезпечує сесію для роутів.

    Закривається автоматично після завершення запиту.
    """
    async with SessionLocal() as session:
        yield session
