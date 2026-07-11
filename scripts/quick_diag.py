from __future__ import annotations

import asyncio
import contextlib
from datetime import datetime
import sys

import aiohttp


async def check_service(name, url, expected_status=200):
    try:
        async with aiohttp.ClientSession() as session:
            start = datetime.now()
            async with session.get(url, timeout=5) as response:
                (datetime.now() - start).total_seconds()
                status = response.status
                return status == expected_status
    except Exception:
        return False

async def main():

    results = await asyncio.gather(
        check_service("Frontend (NGINX)", "http://localhost:80", 200),
        check_service("Backend API", "http://localhost:8090/health", 200),
        check_service("Qdrant", "http://localhost:6333/collections", 200),
        check_service("OpenSearch", "http://localhost:9200", 200),
        check_service("MinIO Console", "http://localhost:9001/minio/health/live", 200),
        check_service("Prometheus", "http://localhost:9092/-/healthy", 200),
        check_service("Grafana", "http://localhost:3001/api/health", 200),
        check_service("RabbitMQ Mgmt", "http://localhost:15672", 200)
    )

    if all(results):
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    with contextlib.suppress(KeyboardInterrupt):
        asyncio.run(main())
