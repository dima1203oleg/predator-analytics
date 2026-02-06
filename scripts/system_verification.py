#!/usr/bin/env python3.12
"""🛡️ PREDATOR COMPREHENSIVE VERIFICATION SUITE v25.0
==================================================
Автоматична перевірка цілісності даних, сервісів та ШІ.
"""

from __future__ import annotations

import asyncio
from datetime import datetime
import os
from pathlib import Path
import sys
import time


# ⚜️ ETERNAL RUNTIME GUARD
if sys.version_info < (3, 12):
    print("\n❌ FATAL: VERIFICATION SUITE REQUIRES PYTHON 3.12.", file=sys.stderr)
    sys.exit(1)

# Add project roots
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(PROJECT_ROOT / "services/api-gateway"))

def print_result(name: str, status: bool, detail: str = ""):
    icon = "✅" if status else "❌"
    color = "\033[1;32m" if status else "\033[1;31m"
    print(f"{icon} {name:.<40} {color}{'OK' if status else 'FAILED'}\033[0m {detail}")

async def check_database_conn():
    print("\n📊 1. INFRASTRUCTURE & DATA INTEGRITY")

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
    print("\n🤖 2. AGENTS & ORCHESTRATION")
    try:
        import httpx
        async with httpx.AsyncClient() as client:
            resp = await client.get("http://localhost:8000/system/autonomy/status")
            if resp.status_code == 200:
                data = resp.json()
                print_result("Autonomy Status API", True)
                print(f"   - Level: {data.get('autonomy_level')}")
                print(f"   - Coverage: {data.get('automation_percentage')}%")
            else:
                print_result("Autonomy Status API", False, f"HTTP {resp.status_code}")
    except Exception:
        print_result("Autonomy Status API", False, "Gateway Offline")

async def main():
    print("="*60)
    print("⚜️  PREDATOR v25.0 SYSTEM VERIFICATION")
    print("   Timestamp:", datetime.now().isoformat())
    print("="*60)

    await check_database_conn()
    await check_agents()

    print("\n" + "="*60)
    print("🛡️ REPORT COMPLETE")
    print("="*60)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
