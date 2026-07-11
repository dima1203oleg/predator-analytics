import asyncio
import logging
from app.services.rag_service import rag_service

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

TENANT_ID = "a0000000-0000-0000-0000-000000000001"

async def test_rag():
    logger.info("Starting RAG Service direct test...")
    question = "Що відомо про компанію Test Importer LLC? Які товари вона імпортує згідно з деклараціями?"
    logger.info(f"Question: {question}")
    
    try:
        response = await rag_service.query(
            question=question,
            tenant_id=TENANT_ID,
            model="qwen3:latest-optimized",
            score_threshold=0.0
        )
        
        logger.info("✅ Success! RAG Pipeline works.")
        logger.info(f"Answer: {response.answer}")
        logger.info(f"Sources used: {response.citations}")
        logger.info(f"Context chunks: {response.context_chunks}")
    except Exception as e:
        logger.error(f"❌ Failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_rag())
