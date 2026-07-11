from __future__ import annotations

import asyncio
import os
import sys

# Add project root to pythonpath
sys.path.append(os.getcwd())

from sqlalchemy import text

from libs.core.database import engine


async def check_tables():
    try:
        async with engine.connect() as conn:
            # Check schemas
            result = await conn.execute(text("SELECT schema_name FROM information_schema.schemata WHERE schema_name IN ('gold', 'staging')"))
            [r[0] for r in result.fetchall()]

            # Check tables
            result = await conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema='public'"))
            [r[0] for r in result.fetchall()]
            # print(f"Public tables: {tables}")

    except Exception:
        pass

if __name__ == "__main__":
    asyncio.run(check_tables())
