
"""Script: simulate_traffic.py
Purpose: Generate synthetic events to test Predator API and RTB Engine.
Usage: python scripts/simulate_traffic.py --url http://localhost:8000
"""
import argparse
import asyncio
from datetime import datetime
import json
import random
import uuid

import httpx

EVENTS = [
    "ModelPerformanceDegraded",
    "SecurityVulnerabilityDetected",
    "CostBudgetAlert",
    "UserLogin",
    "DataIngestionComplete"
]

SOURCES = ["fraud-detector", "churn-predictor", "security-scanner", "billing-service"]

async def send_event(client, url):
    event_type = random.choice(EVENTS)
    source = random.choice(SOURCES)

    payload = {
        "event_id": str(uuid.uuid4()),
        "event_type": event_type,
        "source": source,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "context": {
            "value": random.randint(1, 150),
            "severity": random.choice(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
            "user_id": f"user_{random.randint(1000, 9999)}"
        },
        "tenant_id": "default"
    }

    # In a real scenario, we might hit the /analytics endpoint or a dedicated ingestion endpoint
    # For now, we simulate hitting the insight API or just printing

    # Since we don't have a direct ingestion endpoint in API (it goes to RTB directly typically),
    # we can simulate an insight request about this event.
    try:
        resp = await client.post(
            f"{url}/v1/insights/generate",
            json={
                "query": f"Analyze this event: {json.dumps(payload)}",
                "context": payload
            }
        )
        if resp.status_code == 200:
            pass
        else:
            pass
    except Exception:
        pass

async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default="http://localhost:8000", help="API URL")
    parser.add_argument("--count", type=int, default=10, help="Number of events")
    args = parser.parse_args()


    async with httpx.AsyncClient() as client:
        tasks = [send_event(client, args.url) for _ in range(args.count)]
        await asyncio.gather(*tasks)

if __name__ == "__main__":
    asyncio.run(main())
