
import asyncio
import aiohttp
import sys
from datetime import datetime

async def check_service(name, url, expected_status=200):
    try:
        async with aiohttp.ClientSession() as session:
            start = datetime.now()
            async with session.get(url, timeout=5) as response:
                duration = (datetime.now() - start).total_seconds()
                status = response.status
                if status == expected_status:
                    print(f"✅ {name:<20} OK ({duration:.2f}s)")
                    return True
                else:
                    print(f"❌ {name:<20} FAIL (Status: {status})")
                    return False
    except Exception as e:
        print(f"❌ {name:<20} DOWN ({str(e)})")
        return False

async def main():
    print(f"🔍 SYSTEM DIAGNOSTICS DETAILED SCAN - {datetime.now()}")
    print("-" * 50)

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

    print("-" * 50)
    if all(results):
        print("🚀 ALL SYSTEMS ONLINE")
        sys.exit(0)
    else:
        print("⚠️ SOME SYSTEMS UNHEALTHY")
        sys.exit(1)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
