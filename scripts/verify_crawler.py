import asyncio
import sys
import os

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "ua-sources")))

from app.services.crawler_service import get_crawler_service
from app.agents.data.crawler_agent import CrawlerAgent

async def main():
    print("🕷️ Predator Crawler Verification 🕷️")
    
    # 1. Test Service Directly
    print("\n1. Testing CrawlerService (Target: http://example.com)...")
    crawler = get_crawler_service()
    try:
        result = await crawler.crawl_page("http://example.com")
        if result:
            print(f"✅ Crawled: {result.title}")
            print(f"   Content Length: {len(result.content)} chars")
            print(f"   Links Found: {len(result.links)}")
        else:
            print("❌ Crawl returned None")
    except Exception as e:
        print(f"❌ Service Failed: {e}")
        
    await crawler.close()

    # 2. Test Agent (Mocking Qdrant connection via flag if possible, or just expect error)
    print("\n2. Testing CrawlerAgent...")
    agent = CrawlerAgent()
    try:
        # We set store=False to avoid Qdrant connection error blocking us, 
        # unless we want to verify that storage logic is called.
        # Let's try store=False for a clean test of the agent logic.
        response = await agent.process({"url": "http://example.com", "max_pages": 1, "store": False})
        
        if response.result['status'] == 'success':
            print(f"✅ Agent Success: {response.result['stats']}")
        else:
            print(f"❌ Agent Failed: {response.result.get('error')}")
            
    except Exception as e:
        print(f"❌ Agent Exception: {e}")

if __name__ == "__main__":
    asyncio.run(main())
