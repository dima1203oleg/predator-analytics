from __future__ import annotations

"""
OpenSearch Distribution Adapter (Canonical v4.2.0)

Handles distribution of data to OpenSearch search engine with integration 
to the canonical OpenSearchIndexer service. (COMP-042)
"""

import asyncio
from datetime import datetime
import json
import logging
from typing import Any
import uuid

from .data_distributor import DistributionResult
from app.services.opensearch_indexer import opensearch_indexer

logger = logging.getLogger(__name__)

class OpenSearchAdapter:
    """OpenSearch distribution adapter.

    Connects DataDistributor to the core opensearch_indexer service
    for seamless full-text search indexing.
    """

    def __init__(self, enabled: bool = True, index_name: str = "people_index"):
        self.enabled = enabled
        self.index_name = index_name
        self._index_ensured = False

        if enabled:
            logger.info("OpenSearch adapter initialized with index: %s", index_name)
        else:
            logger.info("OpenSearch adapter disabled")

    def distribute(self, data: dict[str, Any] | list[dict[str, Any]]) -> DistributionResult:
        """Distribute data to OpenSearch."""
        if not self.enabled:
            return DistributionResult(False, "opensearch", error="OpenSearch adapter is disabled")

        if not data:
            return DistributionResult(False, "opensearch", error="No data provided")

        records = data if isinstance(data, list) else [data]
        
        # Ensure ID exists for async bulk
        processed_records = []
        for r in records:
            doc = r.copy()
            doc_id = doc.get("id", doc.get("_id", str(uuid.uuid4())))
            doc["id"] = doc_id
            processed_records.append(doc)

        try:
            try:
                loop = asyncio.get_running_loop()
                result = loop.run_until_complete(self._distribute_async(processed_records))
            except RuntimeError:
                result = asyncio.run(self._distribute_async(processed_records))
            return result
        except Exception as e:
            error_msg = f"OpenSearch distribution failed: {e!s}"
            logger.exception(error_msg)
            return DistributionResult(False, "opensearch", error=error_msg)

    async def _distribute_async(self, records: list[dict[str, Any]]) -> DistributionResult:
        if not self._index_ensured:
            try:
                await opensearch_indexer.create_index(self.index_name)
                self._index_ensured = True
            except Exception as e:
                logger.warning(f"Failed to ensure index creation, continuing: {e}")
            
        result = await opensearch_indexer.index_documents(
            index_name=self.index_name,
            documents=records,
            pii_safe=False,
            tenant_id="predator",
        )
        
        return DistributionResult(
            True,
            "opensearch",
            data={
                "index": self.index_name,
                "documents_indexed": result.get("indexed_opensearch", 0),
                "timestamp": datetime.now().isoformat(),
            },
        )

    def is_healthy(self) -> bool:
        """Check if adapter is ready to use."""
        return self.enabled
