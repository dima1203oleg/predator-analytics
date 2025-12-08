import os
import logging
from typing import Dict, Any, List, Optional
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
    - Multi-tenancy via tenant_id filtering
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
            self._ensure_mapping(index_name)
            return
        
        # Default mappings including tenant_id
        body = {
            "mappings": {
                "properties": {
                    "tenant_id": {"type": "keyword"},
                    "title": {"type": "text"},
                    "content": {"type": "text"},
                    "created_at": {"type": "date"}
                }
            }
        }
        
        if mappings:
            body["mappings"]["properties"].update(mappings.get("properties", {}))
            
        await self.client.indices.create(index=index_name, body=body)
        logger.info(f"Created index: {index_name} with tenant mappings")

    async def _ensure_mapping(self, index_name: str):
        """Ensure tenant_id mapping exists on existing index."""
        try:
            await self.client.indices.put_mapping(
                index=index_name,
                body={
                    "properties": {
                        "tenant_id": {"type": "keyword"}
                    }
                }
            )
        except Exception as e:
            logger.warning(f"Failed to update mapping for {index_name}: {e}")

    async def index_documents(
        self, 
        index_name: str, 
        documents: List[Dict[str, Any]], 
        pii_safe: bool = True,
        embedding_service: Any = None,
        qdrant_service: Any = None,
        tenant_id: str = "default"
    ) -> Dict[str, Any]:
        """
        Bulk index documents into OpenSearch AND Qdrant (Dual Indexing).
        
        Args:
            index_name: Target OpenSearch index
            documents: List of documents
            pii_safe: Apply PII masking
            embedding_service: Service to generate vectors (optional)
            qdrant_service: Service to store vectors (optional)
            tenant_id: Tenant context for isolation
        """
        logger.info(f"Indexing {len(documents)} documents to {index_name} [Tenant: {tenant_id}]")
        
        # 1. Apply PII masking and Inject Tenant ID
        processed_docs = []
        for doc in documents:
            if pii_safe:
                doc = self._mask_pii(doc)
            
            # Ensure tenant_id is set
            if "tenant_id" not in doc:
                doc["tenant_id"] = tenant_id
            
            processed_docs.append(doc)
        
        # 2. Index to OpenSearch
        actions = [
            {
                "_index": index_name,
                "_source": doc,
                "_id": doc.get("id") # Ensure ID consistency
            }
            for doc in processed_docs
        ]
        
        success, failed = await helpers.async_bulk(self.client, actions, raise_on_error=False)
        
        # 3. Index to Qdrant (if services provided)
        qdrant_count = 0
        if embedding_service and qdrant_service:
            try:
                # Prepare batch for Qdrant
                qdrant_docs = []
                for doc in processed_docs:
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
                        "published_date": doc.get("published_date"),
                        "tenant_id": doc.get("tenant_id")
                    }
                    
                    qdrant_docs.append({
                        "id": doc_id,
                        "embedding": embedding,
                        "metadata": metadata
                    })
                
                # Bulk upsert to Qdrant with tenant context
                if qdrant_docs:
                    await qdrant_service.index_batch(qdrant_docs, tenant_id=tenant_id)
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
        
        # Create copy to avoid mutating original if needed elsewhere (though here we want mutation)
        doc_copy = document.copy()
        
        for field in pii_fields:
            if field in doc_copy:
                # Simple masking strategy
                original = str(doc_copy[field])
                if len(original) > 4:
                    doc_copy[field] = original[:2] + "****" + original[-2:]
                else:
                    doc_copy[field] = "****"
        
        return doc_copy

    async def search(
        self, 
        index_name: str, 
        query: str = None, 
        query_body: Dict[str, Any] = None, 
        size: int = 10,
        tenant_id: str = None
    ) -> Dict[str, Any]:
        """
        Execute a search query with tenant isolation.
        
        Args:
            index_name: Index to search
            query: Simple text query
            query_body: Advanced query DSL
            size: Number of results
            tenant_id: Tenant context for filtering
        """
        if query_body:
            body = query_body
            # Ideally, we should inject tenant filter into query_body here for security,
            # but that requires parsing the DSL. For now, we assume trusted caller or
            # advanced usage handles it. 
            # TODO: Deep merge filter into query_body
            if tenant_id:
                logger.warning("Tenant ID provided with raw query_body - verify filter manually!")
                
        elif query:
            # Simple text search across all fields WITH tenant filter
            must_clause = {
                "multi_match": {
                    "query": query,
                    "fields": ["title^2", "content", "category"],
                    "type": "best_fields"
                }
            }
            
            filter_clause = []
            if tenant_id:
                filter_clause.append({"term": {"tenant_id": tenant_id}})
            
            body = {
                "query": {
                    "bool": {
                        "must": must_clause,
                        "filter": filter_clause
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
            # Match all (filtered by tenant)
            if tenant_id:
                body = {
                    "query": {
                        "bool": {
                            "must": {"match_all": {}},
                            "filter": [{"term": {"tenant_id": tenant_id}}]
                        }
                    },
                    "size": size
                }
            else:
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
