"""
PostgreSQL Sink — PREDATOR Analytics v55.2-SM-EXTENDED.
Ефективний запис пакетів даних з підтримкою UPSERT.
"""
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.dialects.postgresql import insert
from app.config import get_settings
from predator_common.models import Company, Declaration

settings = get_settings()

class PostgresSink:
    def __init__(self):
        db_url = f"postgresql+asyncpg://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}@{settings.POSTGRES_HOST}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}"
        self.engine = create_async_engine(db_url, pool_pre_ping=True)
        self.async_session = sessionmaker(
            self.engine, class_=AsyncSession, expire_on_commit=False
        )

    async def upsert_companies(self, batch: List[Dict[str, Any]]):
        """Виконує UPSERT для компаній за UEID."""
        if not batch: return
        
        async with self.async_session() as session:
            for item in batch:
                stmt = insert(Company).values(**item)
                stmt = stmt.on_conflict_do_update(
                    index_elements=['ueid'],
                    set_={k: v for k, v in item.items() if k not in ['ueid', 'created_at']}
                )
                await session.execute(stmt)
            await session.commit()

    async def write_batch(self, table_name: str, batch: List[Dict[str, Any]]):
        """
        Загальний метод запису. 
        У версії v55.2 рекомендується використовувати спеціалізовані методи upsert.
        """
        if table_name == "companies":
            await self.upsert_companies(batch)
        else:
            # Спрощений запис для інших таблиць
            async with self.async_session() as session:
                # В реальній системі тут буде bulk insert
                pass

    async def close(self):
        await self.engine.dispose()
