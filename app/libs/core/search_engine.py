"""🔍 SEARCH ENGINE (OpenSearch Integration).
==========================================
Core component for full-text and faceted search.
Part of PREDATOR V45 Organism Architecture.
"""

import logging
import os
from typing import Any


logger = logging.getLogger("core.search_engine")


class SearchEngine:
    def __init__(self, index_name: str = "predator_index"):
        self.index_name = index_name
        self.host = os.getenv("OPENSEARCH_HOST", "opensearch")
        self.port = int(os.getenv("OPENSEARCH_PORT", 9200))
        self.client = None

        # Try importing opensearch-py
        try:
            from opensearchpy import OpenSearch

            self.client = OpenSearch(
                hosts=[{"host": self.host, "port": self.port}], http_compress=True, use_ssl=False
            )
            logger.info(f"✅ OpenSearch client initialized: {self.host}:{self.port}")
        except ImportError:
            logger.warning("⚠️ OpenSearch library not installed.")
        except Exception as e:
            logger.exception(f"❌ OpenSearch init failed: {e}")

    async def index_documents(self, documents: list[dict[str, Any]]):
        """Index multiple documents."""
        if not self.client:
            logger.info(f"🔎 [MOCK] Indexed {len(documents)} docs (OpenSearch unavailable)")
            return

        try:
            # Simple bulk index (can be optimized with helpers.bulk)
            for doc in documents:
                self.client.index(index=self.index_name, body=doc, refresh=True)
            logger.info(f"🔎 Indexed {len(documents)} documents in OpenSearch")
        except Exception as e:
            logger.exception(f"Indexing failed: {e}")

    async def search(self, query: str) -> list[dict[str, Any]]:
        if not self.client:
            return []

        try:
            response = self.client.search(
                index=self.index_name,
                body={
                    "query": {
                        "multi_match": {
                            "query": query,
                            "fields": ["title", "content", "company_name"],
                        }
                    }
                },
            )
            return [hit["_source"] for hit in response["hits"]["hits"]]
        except Exception as e:
            logger.exception(f"Search failed: {e}")
            return []


# Singleton
search_engine = SearchEngine()
