from __future__ import annotations

import asyncio
import os
import sys

# Add project root to sys.path
sys.path.append(os.path.join(os.getcwd(), "apps/backend"))
sys.path.append(os.getcwd())

from sqlalchemy import text

from app.libs.core.database import Base, engine
from app.libs.core.models import *  # Import all models to register them


async def migrate():
    async with engine.begin() as conn:
        # Create schema gold if not exists
        await conn.execute(text("CREATE SCHEMA IF NOT EXISTS gold"))
        # Create all tables (this is safe as it uses CREATE TABLE IF NOT EXISTS)
        await conn.run_sync(Base.metadata.create_all)


if __name__ == "__main__":
    asyncio.run(migrate())
