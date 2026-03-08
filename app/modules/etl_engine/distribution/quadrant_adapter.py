from __future__ import annotations


"""
Quadrant (Qdrant) Distribution Adapter

Handles distribution of data to Qdrant vector database using canonical service.
"""

import asyncio
from datetime import datetime
import json
import logging
from typing import Any
import uuid

from app.modules.etl_engine.distribution.data_distributor import DistributionResult
from app.services.qdrant_service import qdrant_service


# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class QuadrantAdapter:
    """Quadrant (Qdrant) distribution adapter.

    This adapter handles storing vector embeddings in Qdrant database.
    It uses the canonical QdrantService for all operations.
    """

    def __init__(self, enabled: bool = True, collection_name: str = "documents_vectors"):
        """Initialize the Quadrant adapter.

        Args:
            enabled: Whether this adapter is enabled
            collection_name: Qdrant collection name for storing embeddings
        """
        self.enabled = enabled
        self.collection_name = collection_name
        
        if enabled:
            logger.info(f"Quadrant adapter initialized with collection: {collection_name}")
        else:
            logger.info("Quadrant adapter disabled")

    def distribute(self, data: Any) -> DistributionResult:
        """Distribute data to Qdrant.

        Args:
            data: Data to distribute (single record or list of records)

        Returns:
            DistributionResult with status and metadata
        """
        if not self.enabled:
            return DistributionResult(True, "quadrant", data={"status": "disabled"})

        try:
            # Prepare records
            records = []
            if isinstance(data, list):
                records = data
            elif isinstance(data, dict):
                # Check if it's the wrapper dict from distributor
                if "records" in data and isinstance(data["records"], list):
                    records = data["records"]
                else:
                    records = [data]
            else:
                records = [data]

            if not records:
                return DistributionResult(True, "quadrant", data={"records_inserted": 0})

            # Prepare batch for Qdrant
            batch_docs = []
            for record in records:
                # We need an ID and an embedding
                doc_id = record.get("id") or record.get("_id") or str(uuid.uuid4())
                embedding = record.get("embedding") or record.get("_vector")
                
                if embedding is None:
                    # Generate a fallback deterministic "embedding" if none provided
                    embedding = self._generate_fallback_embedding(record)
                
                # Metadata is the record itself minus special fields
                metadata: dict[str, Any] = {k: v for k, v in record.items() if not k.startswith("_") and k != "embedding"}
                
                batch_docs.append({
                    "id": doc_id,
                    "embedding": embedding,
                    "metadata": metadata
                })

            # Execute actual indexing via service
            tenant_id = "default"
            if records and isinstance(records[0], dict):
                tenant_id = str(records[0].get("tenant_id", "default"))

            loop = asyncio.get_event_loop()
            if loop.is_running():
                future = asyncio.run_coroutine_threadsafe(
                    qdrant_service.index_batch(batch_docs, tenant_id=tenant_id),
                    loop
                )
                future.result()
            else:
                asyncio.run(qdrant_service.index_batch(batch_docs, tenant_id=tenant_id))

            record_count = len(records)
            logger.info(
                f"Successfully indexed {record_count} records into Qdrant collection '{self.collection_name}'"
            )

            # Return success result with metadata
            return DistributionResult(
                True,
                "quadrant",
                data={
                    "collection": self.collection_name,
                    "records_inserted": record_count,
                    "timestamp": datetime.now().isoformat(),
                },
            )

        except Exception as e:
            error_msg = f"Quadrant distribution failed: {e!s}"
            logger.exception(error_msg)
            return DistributionResult(False, "quadrant", error=error_msg)

    def _generate_fallback_embedding(self, record: dict[str, Any]) -> list[float]:
        """Generate a deterministic fallback vector embedding if none exists.
        
        Args:
            record: Data record to embed

        Returns:
            List of floats representing the embedding
        """
        # Create a 384-dimensional embedding (matching QdrantService default)
        embedding_size = 384
        
        # Use a hash of the record to seed the "embedding"
        record_str = json.dumps(record, sort_keys=True, default=str)
        import hashlib
        import random
        h = hashlib.sha256(record_str.encode()).digest()
        
        # Use first 4 bytes as seed
        seed = int.from_bytes(h[0:4], "little")
        rng = random.Random(seed)
        
        embedding = [rng.uniform(-1, 1) for _ in range(embedding_size)]

        return embedding

    def create_collection(self, collection_name: str | None = None) -> DistributionResult:
        """Create a new collection in Qdrant.

        Args:
            collection_name: Optional name for the collection

        Returns:
            DistributionResult with status
        """
        name = collection_name or self.collection_name
        
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                future = asyncio.run_coroutine_threadsafe(
                    qdrant_service.create_collection(name),
                    loop
                )
                future.result()
            else:
                asyncio.run(qdrant_service.create_collection(name))
                
            return DistributionResult(True, "quadrant", data={"collection": name})
        except Exception as e:
            return DistributionResult(False, "quadrant", error=str(e))
