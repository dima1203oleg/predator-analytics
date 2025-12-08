
import os
import logging
from typing import Dict, List, Any, Optional

try:
    from notion_client import AsyncClient
    NOTION_AVAILABLE = True
except ImportError:
    NOTION_AVAILABLE = False
    class AsyncClient:
        def __init__(self, auth=None): pass

logger = logging.getLogger("service.notion")

class NotionService:
    """
    Service for integrating with Notion API.
    Used to index workspaces, pages, and databases into the Knowledge Base.
    """
    
    def __init__(self):
        self.token = os.getenv("NOTION_TOKEN")
        if NOTION_AVAILABLE and self.token:
            self.client = AsyncClient(auth=self.token)
        else:
            self.client = None
            if self.token and not NOTION_AVAILABLE:
                logger.warning("NOTION_TOKEN is set but notion_client is not installed")

    def is_configured(self) -> bool:
        return self.client is not None and NOTION_AVAILABLE

    async def search(self, query: str = "") -> List[Dict[str, Any]]:
        """
        Search pages and databases in Notion.
        """
        if not self.client or not NOTION_AVAILABLE:
            return []
            
        try:
            # Empty query returns all pages
            params = {}
            if query:
                params["query"] = query
                
            response = await self.client.search(**params)
            
            results = []
            for item in response.get("results", []):
                title = "Untitled"
                if "properties" in item:
                    # Logic to extract title varies by page/db
                    props = item["properties"]
                    # Try common title fields
                    for key, val in props.items():
                        if val["type"] == "title":
                            if val["title"]:
                                title = val["title"][0]["plain_text"]
                                break
                                
                results.append({
                    "id": item["id"],
                    "title": title,
                    "url": item["url"],
                    "type": item["object"],
                    "last_edited": item["last_edited_time"]
                })
            return results
            
        except Exception as e:
            logger.error(f"Notion search failed: {e}")
            raise Exception(str(e))

    async def index_page(self, page_id: str):
        """
        Ingest a Notion page into Predator's knowledge base.
        Retrieves blocks and converts to text.
        """
        if not self.client or not NOTION_AVAILABLE:
            raise Exception("Notion not configured or sdk missing")
            
        try:
            # 1. Get Page Details
            page = await self.client.pages.retrieve(page_id)
            title = "Notion Page"
            # Extract title again... (simplified)
            
            # 2. Get Blocks (Content)
            blocks = await self.client.blocks.children.list(page_id)
            
            content_parts = []
            for block in blocks.get("results", []):
                b_type = block["type"]
                if b_type in block:
                    text_obj = block[b_type].get("rich_text", [])
                    if text_obj:
                        text = "".join([t["plain_text"] for t in text_obj])
                        content_parts.append(text)
            
            full_content = "\n".join(content_parts)
            
            if len(full_content) < 10:
                logger.warning(f"Notion page {page_id} content too short to index")
                return 0

            # 3. Create Document
            document = {
                "title": f"Notion: {page.get('url', page_id)}",
                "content": full_content,
                "source": "notion",
                "category": "documentation",
                "metadata": {
                    "page_id": page_id,
                    "url": page.get("url")
                }
            }
            
            # 4. Index via OpenSearch (Lazy import)
            from app.services.opensearch_indexer import OpenSearchIndexer
            from app.services.qdrant_service import QdrantService
            from app.services.embedding_service import EmbeddingService
            
            indexer = OpenSearchIndexer()
            qdrant = QdrantService()
            embedder = EmbeddingService()
            
            await indexer.index_documents(
                index_name="documents_safe",
                documents=[document],
                pii_safe=True,
                embedding_service=embedder,
                qdrant_service=qdrant
            )
            
            return 1
            
        except Exception as e:
            logger.error(f"Failed to index notion page: {e}")
            raise Exception(str(e))

# Singleton
notion_service = NotionService()

def get_notion_service():
    return notion_service
