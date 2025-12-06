import os
import logging
from typing import Dict, Any, List
from opensearchpy import AsyncOpenSearch, helpers
from datetime import datetime

logger = logging.getLogger("service.opensearch_indexer")

class OpenSearchIndexer:
    """
    Service for indexing data into OpenSearch.
    Handles:
    - Index creation with mappings
    - Document indexing (bulk)
    - PII masking
    - ILM policy application
    """
    
    def __init__(self):
        self.host = os.getenv("OPENSEARCH_URL", "http://localhost:9200")
        self.client = AsyncOpenSearch(
            hosts=[self.host],
            http_auth=None,  # Disabled security in dev
            use_ssl=False,
            verify_certs=False
        )

    async def create_index(self, index_name: str, mappings: Dict[str, Any] = None):
        """Create an index with optional mappings."""
        if await self.client.indices.exists(index=index_name):
            logger.info(f"Index {index_name} already exists")
            return
        
        body = {"mappings": mappings} if mappings else {}
        await self.client.indices.create(index=index_name, body=body)
        logger.info(f"Created index: {index_name}")

    async def index_documents(
        self, 
        index_name: str, 
        documents: List[Dict[str, Any]], 
        pii_safe: bool = True,
        embedding_service: Any = None,
        qdrant_service: Any = None
    ) -> Dict[str, Any]:
        """
        Bulk index documents into OpenSearch AND Qdrant (Dual Indexing).
        
        Args:
            index_name: Target OpenSearch index
            documents: List of documents
            pii_safe: Apply PII masking
            embedding_service: Service to generate vectors (optional)
            qdrant_service: Service to store vectors (optional)
        """
        logger.info(f"Indexing {len(documents)} documents to {index_name} [PII Safe: {pii_safe}]")
        
        # 1. Apply PII masking
        if pii_safe:
            documents = [self._mask_pii(doc) for doc in documents]
        
        # 2. Index to OpenSearch
        actions = [
            {
                "_index": index_name,
                "_source": doc,
                "_id": doc.get("id") # Ensure ID consistency
            }
            for doc in documents
        ]
        
        success, failed = await helpers.async_bulk(self.client, actions, raise_on_error=False)
        
        # 3. Index to Qdrant (if services provided)
        qdrant_count = 0
        if embedding_service and qdrant_service:
            try:
                # Prepare batch for Qdrant
                qdrant_docs = []
                for doc in documents:
                    doc_id = str(doc.get("id", ""))
                    if not doc_id:
                        continue
                        
                    # Create text for embedding (Title + Content)
                    text_to_embed = f"{doc.get('title', '')} {doc.get('content', '')}".strip()
                    if not text_to_embed:
                        continue
                    
                    # Generate embedding
                    embedding = embedding_service.generate_embedding(text_to_embed)
                    
                    # Prepare metadata (payload)
                    metadata = {
                        "title": doc.get("title"),
                        "snippet": doc.get("content", "")[:200],
                        "source": doc.get("source", "unknown"),
                        "category": doc.get("category"),
                        "published_date": doc.get("published_date")
                    }
                    
                    qdrant_docs.append({
                        "id": doc_id,
                        "embedding": embedding,
                        "metadata": metadata
                    })
                
                # Bulk upsert to Qdrant
                if qdrant_docs:
                    await qdrant_service.index_batch(qdrant_docs)
                    qdrant_count = len(qdrant_docs)
                    logger.info(f"Successfully indexed {qdrant_count} vectors to Qdrant")
                    
            except Exception as e:
                logger.error(f"Qdrant indexing failed: {e}")
        
        return {
            "indexed_opensearch": success,
            "indexed_qdrant": qdrant_count,
            "failed": len(failed) if failed else 0
        }

    def _mask_pii(self, document: Dict[str, Any]) -> Dict[str, Any]:
        """
        Mask PII fields in document.
        Fields to mask: edrpou, company_name, person_name
        """
        pii_fields = ["edrpou", "company_name", "person_name", "phone", "email"]
        
        for field in pii_fields:
            if field in document:
                # Simple masking strategy
                original = str(document[field])
                if len(original) > 4:
                    document[field] = original[:2] + "****" + original[-2:]
                else:
                    document[field] = "****"
        
        return document

    async def search(self, index_name: str, query: str = None, query_body: Dict[str, Any] = None, size: int = 10) -> Dict[str, Any]:
        """
        Execute a search query.
        
        Args:
            index_name: Index to search
            query: Simple text query (will be converted to match query)
            query_body: Advanced query DSL (overrides query param)
            size: Number of results
        
        Returns:
            Full OpenSearch response with hits
        """
        if query_body:
            body = query_body
        elif query:
            # Simple text search across all fields
            body = {
                "query": {
                    "multi_match": {
                        "query": query,
                        "fields": ["title^2", "content", "category"],
                        "type": "best_fields"
                    }
                },
                "size": size,
                "highlight": {
                    "fields": {
                        "content": {"fragment_size": 150, "number_of_fragments": 1},
                        "title": {}
                    }
                }
            }
        else:
            # Match all
            body = {"query": {"match_all": {}}, "size": size}
        
        try:
            response = await self.client.search(index=index_name, body=body)
            return response
        except Exception as e:
            logger.error(f"Search failed: {e}")
            return {"hits": {"hits": [], "total": {"value": 0}}}

    async def close(self):
        """Close the client connection."""
        await self.client.close()
