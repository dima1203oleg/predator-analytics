from __future__ import annotations

import asyncio
import logging
import os
import sys
import time


# Add path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'services/api-gateway'))

from app.services.embedding_service import get_embedding_service


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("test.batch")

async def test_batching():
    service = get_embedding_service()

    logger.info("Starting batching test...")

    # Generate multiple requests concurrently
    texts = [
        "What is the capital of Ukraine?",
        "How to optimize neural networks?",
        "Predictive analytics for logistics",
        "Anomaly detection in customs data",
        "Multi-agent AI orchestration"
    ]

    start_time = time.time()

    # Launch concurrent requests
    tasks = [service.generate_embedding_async(text) for text in texts]
    results = await asyncio.gather(*tasks)

    duration = time.time() - start_time

    logger.info(f"Received {len(results)} embeddings in {duration:.4f}s")

    for i, res in enumerate(results):
        logger.info(f"Result {i} size: {len(res)}")
        assert len(res) == 384

    logger.info("Batching test PASSED!")

if __name__ == "__main__":
    try:
        asyncio.run(test_batching())
    except Exception as e:
        logger.exception(f"Test failed: {e}")
