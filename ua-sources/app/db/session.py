"""Database Session Management"""
from sqlalchemy.ext.asyncio import AsyncSession
from typing import AsyncGenerator
from ..core.db import async_session_maker


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Get database session"""
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
