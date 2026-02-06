import asyncio
import os
import sys


# Add shadow_libs
sys.path.append('/Users/dima-mac/Documents/Predator_21/shadow_libs')
# Add libs
sys.path.append('/Users/dima-mac/Documents/Predator_21')

try:
    import asyncpg
    print("asyncpg: OK")
except ImportError as e:
    print(f"asyncpg: MISSING ({e})")
    sys.exit(1)

async def check():
    # Try localhost first
    try:
        conn = await asyncpg.connect('postgresql://admin:666666@localhost:5432/predator_db')
        print("Connected to DB at localhost")
        rows = await conn.fetch("SELECT id, name, source_type, config FROM gold.data_sources")
        for r in rows:
            print(f"Source: {r['name']} ({r['source_type']}) - Config: {r['config']}")
        await conn.close()
    except Exception as e:
        print(f"Failed to connect to localhost: {e}")

if __name__ == "__main__":
    asyncio.run(check())
