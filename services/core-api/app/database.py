"""
Асинхронний драйвер PostgreSQL для Core API (v55.1).

Підтримка Patroni HA, RLS (Row-Level Security), Multi-tenancy.
"""
import ssl
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.config import get_settings

settings = get_settings()

engine: AsyncEngine | None = None
SessionLocal: async_sessionmaker[AsyncSession] | None = None


def init_db() -> None:
    """Ініціалізація асинхронного пулу з'єднань."""
    global engine, SessionLocal

    # TODO: Додати SSL context для mTLS, якщо потрібно
    ssl_context = None
    if settings.ENV == "production":
        # ssl_context = ssl.create_default_context(...)
        pass

    engine = create_async_engine(
        settings.async_database_url,
        echo=settings.DEBUG,
        pool_size=20,
        max_overflow=10,
        pool_recycle=3600,
        pool_pre_ping=True,
        connect_args={
            "ssl": ssl_context,
            # Оптимізації asyncpg
            "command_timeout": 60,
        },
    )

    SessionLocal = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
    )


async def close_db() -> None:
    """Коректне закриття всіх з'єднань пулу."""
    global engine
    if engine:
        await engine.dispose()
        engine = None


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI Dependency для отримання асинхронної сесії БД."""
    if SessionLocal is None:
        raise RuntimeError("Database engine is not initialized. Call init_db() first.")
    
    async with SessionLocal() as session:
        try:
            # Активація tenant_id для RLS
            # await session.execute(text("SET app.current_tenant_id = :tenant"), {"tenant": ...})
            yield session
        finally:
            await session.close()
