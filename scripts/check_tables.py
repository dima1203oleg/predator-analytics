
import asyncio
import sys
import os

# Add project root to pythonpath
sys.path.append(os.getcwd())

from sqlalchemy import text
from libs.core.database import engine

async def check_tables():
    try:
        async with engine.connect() as conn:
            # Check schemas
            result = await conn.execute(text("SELECT schema_name FROM information_schema.schemata WHERE schema_name IN ('gold', 'staging')"))
            schemas = [r[0] for r in result.fetchall()]
            print(f"Schemas found: {schemas}")

            # Check tables
            result = await conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema='public'"))
            tables = [r[0] for r in result.fetchall()]
            print(f"Public tables count: {len(tables)}")
            # print(f"Public tables: {tables}")

    except Exception as e:
        print(f"Error checking DB: {e}")

if __name__ == "__main__":
    asyncio.run(check_tables())
