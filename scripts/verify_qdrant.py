import asyncio
import sys
import os

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "ua-sources")))

from app.agents.data.retriever_agent import RetrieverAgent
from app.services.ingestor import ingestor_service

async def main():
    print("🦁 Predator Qdrant Verification 🦁")
    
    print("\n1. Testing Ingestion (Dry Run)...")
    try:
        # Mocking Qdrant/Embedding to avoid needing actual DB connection if offline
        # But wait, we want to fail if code is broken.
        # We'll rely on the services handling connection errors gracefully.
        
        job = await ingestor_service.start_ingestion(
            "test_source", 
            {"records": [{"id": "test_1", "name": "Test Company", "description": "AI Analytics Provider"}]}
        )
        print(f"✅ Ingestion Job Started: {job.id}")
    except Exception as e:
        print(f"❌ Ingestion Failed: {e}")

    print("\n2. Testing Retriever Agent...")
    try:
        agent = RetrieverAgent()
        response = await agent.process({"query": "analytics"})
        print(f"✅ Retriever Response: {response.result['status']}")
        if response.result['data']:
            print(f"   Found {len(response.result['data'])} results.")
    except Exception as e:
        print(f"❌ Retrieval Failed: {e}")

if __name__ == "__main__":
    asyncio.run(main())
