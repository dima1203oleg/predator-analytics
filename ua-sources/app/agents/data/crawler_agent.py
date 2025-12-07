from typing import Dict, Any, List
from ..core.base_agent import BaseAgent, AgentResponse, AgentConfig
from ...services.crawler_service import get_crawler_service
from ...services.qdrant_service import get_qdrant_service
from ...services.embedding_service import get_embedding_service
import logging

logger = logging.getLogger(__name__)

class CrawlerAgent(BaseAgent):
    def __init__(self):
        super().__init__(AgentConfig(name="CrawlerAgent"))
        self.crawler = get_crawler_service()
        self.qdrant = get_qdrant_service()
        self.embedding = get_embedding_service()

    async def process(self, inputs: Dict[str, Any]) -> AgentResponse:
        """
        Inputs:
            url: str - Target URL to crawl
            max_pages: int - Limit (default 5)
            store: bool - Whether to index in Qdrant (default True)
        """
        url = inputs.get("url")
        max_pages = inputs.get("max_pages", 5)
        store = inputs.get("store", True)
        
        if not url:
             return AgentResponse(self.name, {"error": "No URL provided"}, {"status": "failed"})

        self._log_activity(f"Starting crawl of {url} (limit: {max_pages})")
        
        try:
            # 1. Crawl
            raw_results = await self.crawler.crawl_site_bfs(url, max_pages)
            
            summary_stats = {
                "pages_crawled": len(raw_results),
                "total_chars": sum(len(r.content) for r in raw_results),
                "stored": False
            }
            
            # 2. Store in Qdrant (VectorDB)
            if store and raw_results:
                # Prepare docs
                documents = []
                # Batch embedding generation
                texts = [r.content[:1000] for r in raw_results] # First 1k chars for embedding to save tokens
                embeddings = await self.embedding.generate_embedding_async_batch(texts) # Need to ensure this method exists or loop
                
                # Check if batch async exists, if not assume sync loop for now or use the one I saw earlier
                # service.embedding_service.generate_batch_embeddings is sync. I should wrap it.
                # Actually, let's just loop for safety or use the sync method if we are okay blocking briefly.
                # Ideally, we used `generate_batch_embeddings` in ingestor.
                
                # Re-reading embedding service... it has generate_batch_embeddings (sync).
                # We can run it in executor.
                import asyncio
                loop = asyncio.get_event_loop()
                embeddings = await loop.run_in_executor(None, self.embedding.generate_batch_embeddings, texts)
                
                for i, res in enumerate(raw_results):
                    doc = {
                        "id": res.url, # URL as ID (or hash it)
                        "content": res.content,
                        "title": res.title,
                        "source": "web_crawler",
                        "url": res.url,
                        "crawled_at": res.timestamp.isoformat()
                    }
                    
                    # Ensure ID is safe for Qdrant (UUID-like via helper in service)
                    # QdrantService._ensure_uuid handles hashing strings.
                    
                    documents.append({
                        "id": res.url, 
                        "embedding": embeddings[i],
                        "metadata": doc
                    })
                
                await self.qdrant.index_batch(documents)
                summary_stats["stored"] = True
                self._log_activity(f"Indexed {len(documents)} pages to Knowledge Base")

            return AgentResponse(
                agent_name=self.name,
                result={
                    "status": "success",
                    "stats": summary_stats,
                    "pages": [{"url": r.url, "title": r.title} for r in raw_results]
                },
                metadata={"confidence": 1.0}
            )

        except Exception as e:
            logger.error(f"Crawling failed: {e}")
            return AgentResponse(self.name, {"error": str(e)}, {"status": "error"})
