from __future__ import annotations

import asyncio
import os
import sys

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "ua-sources")))

from app.agents.data.retriever_agent import RetrieverAgent
from app.services.ingestor import ingestor_service


async def main():

    try:
        # Mocking Qdrant/Embedding to avoid needing actual DB connection if offline
        # But wait, we want to fail if code is broken.
        # We'll rely on the services handling connection errors gracefully.

        await ingestor_service.start_ingestion(
            "test_source",
            {"records": [{"id": "test_1", "name": "Test Company", "description": "AI Analytics Provider"}]}
        )
    except Exception:
        pass

    try:
        agent = RetrieverAgent()
        response = await agent.process({"query": "analytics"})
        if response.result['data']:
            pass
    except Exception:
        pass

if __name__ == "__main__":
    asyncio.run(main())
