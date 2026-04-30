from __future__ import annotations

import asyncio
import os
import sys

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "ua-sources")))

from app.agents.data.crawler_agent import CrawlerAgent
from app.services.crawler_service import get_crawler_service


async def main():

    # 1. Test Service Directly
    crawler = get_crawler_service()
    try:
        result = await crawler.crawl_page("http://example.com")
        if result:
            pass
        else:
            pass
    except Exception:
        pass

    await crawler.close()

    # 2. Test Agent (Mocking Qdrant connection via flag if possible, or just expect error)
    agent = CrawlerAgent()
    try:
        # We set store=False to avoid Qdrant connection error blocking us,
        # unless we want to verify that storage logic is called.
        # Let's try store=False for a clean test of the agent logic.
        response = await agent.process({"url": "http://example.com", "max_pages": 1, "store": False})

        if response.result['status'] == 'success':
            pass
        else:
            pass

    except Exception:
        pass

if __name__ == "__main__":
    asyncio.run(main())
