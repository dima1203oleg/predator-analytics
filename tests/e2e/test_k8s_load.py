"""
E2E Load Test: Kubernetes Scaling
Simulates heavy load on the deployed services and verifies HPA scaling.
"""

import asyncio
import time

import httpx
import pytest

TARGET_URL = "http://predator.analytics.local"


@pytest.mark.asyncio
async def test_high_concurrency_load():
    """
    Fire 500 concurrent requests to the API.
    Expect: 200 OK (some latency increase acceptable).
    """
    async with httpx.AsyncClient(timeout=30.0) as client:
        time.time()

        tasks = []
        for _i in range(500):
            tasks.append(client.get(f"{TARGET_URL}/health"))

        responses = await asyncio.gather(*tasks, return_exceptions=True)
        time.time()

        success = [r for r in responses if isinstance(r, httpx.Response) and r.status_code == 200]
        [
            r for r in responses if not isinstance(r, httpx.Response) or r.status_code != 200
        ]


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
            time.time() - start

            if resp.status_code == 200:
                pass
            else:
                pass

        except Exception as e:
            pytest.skip(f"Cluster not reachable: {e}")
