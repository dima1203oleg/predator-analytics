"""
Драйвер бази даних для PREDATOR Analytics v55.2.
Перенесено до спільної бібліотеки для уніфікації доступу (core-api, ingestion-worker, AI engine).
"""
import ssl
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy import text

# Залежить від конфігурації конкретного сервісу
# У реальному середовищі тут може бути абстрактний провайдер налаштувань
from app.config import get_settings

engine: AsyncEngine | None = None
SessionLocal: async_sessionmaker[AsyncSession] | None = None

def init_db(connection_string: str, debug: bool = False) -> None:
    """Ініціалізація пулу з'єднань."""
    global engine, SessionLocal
    
    engine = create_async_engine(
        connection_string,
        echo=debug,
        pool_size=20,
        max_overflow=10,
        pool_recycle=3600,
        pool_pre_ping=True,
    )

    SessionLocal = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
    )

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency для отримання асинхронної сесії."""
    if SessionLocal is None:
        raise RuntimeError("БД не ініціалізовано. Викличте init_db() першим.")
    
    async with SessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
