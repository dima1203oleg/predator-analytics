#!/usr/bin/env python3.12
"""🛡️ PREDATOR COMPREHENSIVE VERIFICATION SUITE v45.0
==================================================
Автоматична перевірка цілісності даних, сервісів та ШІ.
"""

from __future__ import annotations

import asyncio
import contextlib
from pathlib import Path
import sys

# ⚜️ ETERNAL RUNTIME GUARD

# Add project roots
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(PROJECT_ROOT / "services/api_gateway"))

def print_result(name: str, status: bool, detail: str = ""):
    pass

async def check_database_conn():

    # 1. PostgreSQL
    try:
        import asyncpg
        conn = await asyncpg.connect("postgresql://predator:predator_password@localhost:5432/predator_db")
        await conn.close()
        print_result("PostgreSQL Connectivity", True)
    except Exception as e:
        print_result("PostgreSQL Connectivity", False, str(e))

    # 2. Redis
    try:
        import redis.asyncio as redis
        r = redis.from_url("redis://localhost:6379/0")
        await r.ping()
        await r.close()
        print_result("Redis Connectivity", True)
    except Exception:
        print_result("Redis Connectivity", False, str(detail))

    # 3. Qdrant
    try:
        import httpx
        async with httpx.AsyncClient() as client:
            resp = await client.get("http://localhost:6333/collections")
            print_result("Qdrant Vector DB", resp.status_code == 200)
    except Exception:
        print_result("Qdrant Vector DB", False)

    # 4. OpenSearch
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get("http://localhost:9200/")
            print_result("OpenSearch Engine", resp.status_code == 200)
    except Exception:
        print_result("OpenSearch Engine", False)

async def check_agents():
    try:
        import httpx
        async with httpx.AsyncClient() as client:
            resp = await client.get("http://localhost:8000/system/autonomy/status")
            if resp.status_code == 200:
                resp.json()
                print_result("Autonomy Status API", True)
            else:
                print_result("Autonomy Status API", False, f"HTTP {resp.status_code}")
    except Exception:
        print_result("Autonomy Status API", False, "Gateway Offline")

async def main():

    await check_database_conn()
    await check_agents()


if __name__ == "__main__":
    with contextlib.suppress(KeyboardInterrupt):
        asyncio.run(main())
