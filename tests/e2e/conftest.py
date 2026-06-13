import pytest
import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

# Додамо шлях до app для імпортів
import sys
sys.path.insert(0, "/Users/Shared/Predator_60/services/core-api")
sys.path.insert(0, "/Users/Shared/Predator_60/libs")

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://predator:predator_secret@localhost:5432/predator_db")

@pytest.fixture(scope="session")
def event_loop():
    """Створює екземпляр event loop для всієї тестової сесії."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
async def db_engine():
    """Ініціалізація підключення до PostgreSQL."""
    engine = create_async_engine(DATABASE_URL, echo=False)
    yield engine
    await engine.dispose()

@pytest.fixture(scope="function")
async def db_session(db_engine):
    """Створення нової сесії для кожного тесту."""
    async_session = sessionmaker(db_engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        yield session
        # Відкат змін після тесту (якщо потрібно)
        await session.rollback()

@pytest.fixture(scope="session")
def test_tenant_id():
    """ID тестового тенанта для ізоляції даних."""
    return "a0000000-0000-0000-0000-000000000e2e"

@pytest.fixture(scope="session")
def test_user_id():
    """ID тестового користувача."""
    return "b0000000-0000-0000-0000-000000000e2e"

import nest_asyncio
nest_asyncio.apply()

os.environ["MINIO_ACCESS_KEY"] = "admin"
os.environ["MINIO_SECRET_KEY"] = "password"
os.environ["MINIO_ENDPOINT"] = "localhost:9000"
