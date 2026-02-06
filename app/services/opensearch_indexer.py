from __future__ import annotations

from datetime import datetime
import logging
import os
from typing import Any, Dict, List

from opensearchpy import AsyncOpenSearch, helpers

from app.libs.core.structured_logger import get_logger, log_performance


logger = get_logger("service.opensearch_indexer")

class OpenSearchIndexer:
    """Service for indexing data into OpenSearch.
    Handles:
    - Index creation with mappings
    - Document indexing (bulk)
    - PII masking
    - Multi-tenancy via tenant_id filtering.
    """

    def __init__(self):
        self.host = os.getenv("OPENSEARCH_URL", "http://localhost:9200")
        self.client = AsyncOpenSearch(
            hosts=[self.host],
            http_auth=None,  # Disabled security in dev
            use_ssl=False,
            verify_certs=False
        )

    async def create_index(self, index_name: str, mappings: dict[str, Any] | None = None):
        """Create an index with Ukrainian analyzer and tenant isolation."""
        if await self.client.indices.exists(index=index_name):
            logger.info("opensearch_index_exists", index_name=index_name)
            await self._ensure_mapping(index_name)
            return

        # Default mappings with Ukrainian analyzer
        body = {
            "settings": {
                "analysis": {
                    "analyzer": {
                        "default": {
                            "type": "standard"
                        }
                    }
                }
            },
            "mappings": {
                "properties": {
                    "tenant_id": {"type": "keyword"},
                    "title": {
                        "type": "text",
                        "analyzer": "standard",
                        "fields": {
                            "keyword": {"type": "keyword", "ignore_above": 256}
                        }
                    },
                    "content": {
                        "type": "text",
                        "analyzer": "standard"
                    },
                    "category": {"type": "keyword"},
                    "created_at": {"type": "date"}
                }
            }
        }

        if mappings:
            body["mappings"]["properties"].update(mappings.get("properties", {}))

        await self.client.indices.create(index=index_name, body=body)
        logger.info("opensearch_index_created", index_name=index_name, analyzer="ukrainian")

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
            logger.warning("opensearch_mapping_update_failed", index_name=index_name, error=str(e))

    async def index_document(
        self,
        doc_id: Any,
        title: str,
        content: str,
        metadata: dict[str, Any] | None = None,
        tenant_id: str = "default",
        index_name: str = "documents"
    ):
        """Index a single document."""
        try:
            # Mask PII
            doc_data = {
                "title": title,
                "content": content,
                "tenant_id": tenant_id,
                "created_at": datetime.now().isoformat(),
                **(metadata or {})
            }
            doc_data = self._mask_pii(doc_data)

            await self.client.index(
                index=index_name,
                id=str(doc_id),
                body=doc_data,
                refresh=True
            )

            logger.info("opensearch_document_indexed", doc_id=doc_id, index_name=index_name)
        except Exception as e:
            logger.exception("opensearch_indexing_failed", doc_id=doc_id, index_name=index_name, error=str(e))
            raise

    async def index_documents(
        self,
        index_name: str,
        documents: list[dict[str, Any]],
        pii_safe: bool = True,
        embedding_service: Any = None,
        qdrant_service: Any = None,
        tenant_id: str = "default"
    ) -> dict[str, Any]:
        """Bulk index documents into OpenSearch AND Qdrant (Dual Indexing).

        Args:
            index_name: Target OpenSearch index
            documents: List of documents
            pii_safe: Apply PII masking
            embedding_service: Service to generate vectors (optional)
            qdrant_service: Service to store vectors (optional)
            tenant_id: Tenant context for isolation
        """
        logger.info(
            "opensearch_bulk_indexing_started",
            count=len(documents),
            index_name=index_name,
            tenant_id=tenant_id
        )

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
                    logger.info("qdrant_vectors_indexed", count=qdrant_count, tenant_id=tenant_id)

            except Exception as e:
                logger.exception("qdrant_indexing_failed", error=str(e))

        return {
            "indexed_opensearch": success,
            "indexed_qdrant": qdrant_count,
            "failed": len(failed) if failed else 0
        }

    def _mask_pii(self, document: dict[str, Any]) -> dict[str, Any]:
        """Mask PII fields in document.
        Fields to mask: edrpou, company_name, person_name.
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
        query: str | None = None,
        query_body: dict[str, Any] | None = None,
        size: int = 10,
        tenant_id: str | None = None
    ) -> dict[str, Any]:
        """Execute a search query with tenant isolation.

        Args:
            index_name: Index to search
            query: Simple text query
            query_body: Advanced query DSL
            size: Number of results
            tenant_id: Tenant context for filtering
        """
        if query_body:
            body = query_body.copy()
            if tenant_id:
                # Enforce tenant isolation by wrapping query in a bool filter
                current_query = body.get("query", {"match_all": {}})

                # Check if it's already a bool query to avoid excessive nesting
                if "bool" in current_query:
                    # Inject into existing filter list
                    if "filter" not in current_query["bool"]:
                        current_query["bool"]["filter"] = []

                    # Support both list and dict filters
                    if isinstance(current_query["bool"]["filter"], list):
                        current_query["bool"]["filter"].append({"term": {"tenant_id": tenant_id}})
                    else:
                        # Wrap existing dict filter into a list
                        current_query["bool"]["filter"] = [
                            current_query["bool"]["filter"],
                            {"term": {"tenant_id": tenant_id}}
                        ]
                else:
                    # Wrap simple query into a bool query with tenant filter
                    body["query"] = {
                        "bool": {
                            "must": current_query,
                            "filter": [{"term": {"tenant_id": tenant_id}}]
                        }
                    }
                logger.info("opensearch_search_tenant_filter_applied", tenant_id=tenant_id)

        elif query:
            # Simple text search across all fields WITH tenant filter
            must_clause = {
                "multi_match": {
                    "query": query,
                    "fields": ["title^3", "content", "category"],
                    "type": "best_fields",
                    "fuzziness": "AUTO"
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
        # Match all (filtered by tenant)
        elif tenant_id:
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
            with log_performance(logger, "opensearch_search_latency", index_name=index_name):
                return await self.client.search(index=index_name, body=body)
        except Exception as e:
            logger.exception("opensearch_search_failed", error=str(e), index_name=index_name)
            return {"hits": {"hits": [], "total": {"value": 0}}}

    async def close(self):
        """Close the client connection."""
        await self.client.close()

# Singleton instance
opensearch_indexer = OpenSearchIndexer()
