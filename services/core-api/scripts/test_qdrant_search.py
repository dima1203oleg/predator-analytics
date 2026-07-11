import asyncio
import logging
from app.services.ai_service import AIService
from app.services.qdrant_service import qdrant_service

logging.basicConfig(level=logging.INFO)

async def test_qdrant_search():
    question = "Що відомо про компанію Test Importer LLC? Які товари вона імпортує згідно з деклараціями?"
    emb = await AIService.get_embeddings(question)
    
    tenant_id = "a0000000-0000-0000-0000-000000000001"
    collection = f"predator-embeddings-{tenant_id}"
    
    res = await qdrant_service.search(
        collection=collection,
        query_vector=emb,
        tenant_id=tenant_id,
        limit=5,
        score_threshold=0.0  # NO THRESHOLD
    )
    
    print("HITS:")
    for h in res.hits:
        print(f"Score: {h.score}, Payload: {h.payload}")

if __name__ == "__main__":
    asyncio.run(test_qdrant_search())
