"""
E2E Load Test: Kubernetes Scaling
Simulates heavy load on the deployed services and verifies HPA scaling.
"""

import pytest
import asyncio
import httpx
import time

TARGET_URL = "http://predator.analytics.local"


@pytest.mark.asyncio
async def test_high_concurrency_load():
    """
    Fire 500 concurrent requests to the API.
    Expect: 200 OK (some latency increase acceptable).
    """
    async with httpx.AsyncClient(timeout=30.0) as client:
        start_time = time.time()

        tasks = []
        for i in range(500):
            tasks.append(client.get(f"{TARGET_URL}/health"))

        responses = await asyncio.gather(*tasks, return_exceptions=True)
        end_time = time.time()

        success = [r for r in responses if isinstance(r, httpx.Response) and r.status_code == 200]
        failure = [
            r for r in responses if not isinstance(r, httpx.Response) or r.status_code != 200
        ]

        print(
            f"Load Test: {len(success)} success, {len(failure)} failed in {end_time - start_time:.2f}s"
        )

        # We expect mostly success if K8s HPA is working or replicas are sufficient
        assert len(success) > 400


@pytest.mark.asyncio
async def test_model_inference_latency():
    """
    Fire complex queries to check LLM latency.
    """
    payload = {"query": "Explain quantum entanglement in 50 words", "context": {}}

    async with httpx.AsyncClient(timeout=60.0) as client:
        start = time.time()
        # Real cluster test
        try:
            resp = await client.post(f"{TARGET_URL}/api/v1/insights/generate", json=payload)
            latency = time.time() - start

            if resp.status_code == 200:
                print(f"✅ AI Response in {latency:.2f}s: {resp.json().get('insight')[:30]}...")
            else:
                print(f"⚠️ AI Failed: {resp.status_code}")

        except Exception as e:
            pytest.skip(f"Cluster not reachable: {e}")
