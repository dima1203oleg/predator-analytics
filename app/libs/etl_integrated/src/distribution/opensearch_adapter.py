from __future__ import annotations

from typing import Any, Optional, Union


"""
OpenSearch Distribution Adapter

Handles distribution of data to OpenSearch search engine with enhanced monitoring integration.
"""

from datetime import datetime
import json
import logging
from typing import Dict, List
import uuid


# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class OpenSearchAdapter:
    """OpenSearch distribution adapter.
    
    This adapter handles indexing data in OpenSearch for full-text search and analytics.
    It supports index creation, document indexing, and search operations.
    """

    def __init__(self, enabled: bool = True, index_name: str = "people_index"):
        """Initialize the OpenSearch adapter.
        
        Args:
            enabled: Whether this adapter is enabled
            index_name: OpenSearch index name for storing documents
        """
        self.enabled = enabled
        self.index_name = index_name
        self.client = None  # Would be initialized with actual OpenSearch client in production

        if enabled:
            logger.info(f"OpenSearch adapter initialized with index: {index_name}")
        else:
            logger.info("OpenSearch adapter disabled")

    def distribute(self, data: dict[str |  Any, list[dict[str, Any]]]) -> DistributionResult:
        """Distribute data to OpenSearch with monitoring integration.
        
        Args:
            data: Data to distribute (single record or list of records)
            
        Returns:
            DistributionResult with status and metadata
        """
        from .data_distributor import DistributionResult

        if not self.enabled:
            return DistributionResult(
                False, "opensearch",
                error="OpenSearch adapter is disabled"
            )

        try:
            # Validate data
            if not data:
                return DistributionResult(
                    False, "opensearch",
                    error="No data provided for OpenSearch distribution"
                )

            # Convert single record to list for uniform processing
            if isinstance(data, dict):
                data = [data]

            # Ensure index exists (simulated)
            self._ensure_index_exists()

            # Prepare documents for indexing
            documents = []
            for i, record in enumerate(data):
                document = {
                    "_id": str(uuid.uuid4()),
                    "_index": self.index_name,
                    "_source": record,
                    "_timestamp": datetime.now().isoformat()
                }
                documents.append(document)

            # Simulate document indexing
            record_count = len(data)
            logger.info(f"Simulating OpenSearch indexing: {record_count} documents into index '{self.index_name}'")

            # Log sample document
            if len(data) > 0:
                logger.info(f"Sample document: {json.dumps(documents[0], indent=2)}")

            # Integrate with monitoring system
            try:
                from src.brain.monitoring import monitoring_system
                monitoring_system.record_opensearch_metrics("index", record_count)
                monitoring_system.log_for_grafana(
                    f"OpenSearch indexing: {record_count} documents",
                    level="info",
                    index=self.index_name,
                    documents=record_count
                )
            except ImportError:
                # Continue without monitoring if not available
                pass

            # Return success result with metadata
            result = DistributionResult(
                True, "opensearch",
                data={
                    "index": self.index_name,
                    "documents_indexed": record_count,
                    "timestamp": datetime.now().isoformat(),
                    "sample_document": documents[0] if record_count > 0 else None
                }
            )

            return result

        except Exception as e:
            error_msg = f"OpenSearch distribution failed: {e!s}"
            logger.error(error_msg)

            # Record error in monitoring system
            try:
                from src.brain.monitoring import monitoring_system
                monitoring_system.record_opensearch_metrics("index_error")
                monitoring_system.log_for_grafana(
                    f"OpenSearch distribution error: {error_msg}",
                    level="error",
                    error=error_msg
                )
            except ImportError:
                pass

            return DistributionResult(False, "opensearch", error=error_msg)

    def _ensure_index_exists(self) -> None:
        """Ensure that the target index exists (simulated)."""
        # In production, this would create the index if it doesn't exist
        logger.info(f"Ensuring index '{self.index_name}' exists (simulated)")

        # Simulate index creation with mapping
        index_mapping = {
            "mappings": {
                "properties": {
                    "name": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
                    "age": {"type": "integer"},
                    "city": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
                    "score": {"type": "float"},
                    "source_format": {"type": "keyword"},
                    "timestamp": {"type": "date"}
                }
            },
            "settings": {
                "number_of_shards": 1,
                "number_of_replicas": 1
            }
        }
        logger.debug(f"Index mapping: {json.dumps(index_mapping, indent=2)}")

    def create_index(self, index_name: str | None = None) -> DistributionResult:
        """Create a new index in OpenSearch.
        
        Args:
            index_name: Optional index name (uses configured name if None)
            
        Returns:
            DistributionResult with creation status
        """
        from .data_distributor import DistributionResult

        if not self.enabled:
            return DistributionResult(
                False, "opensearch",
                error="OpenSearch adapter is disabled"
            )

        try:
            target_index = index_name or self.index_name

            # Simulate index creation
            logger.info(f"Simulating OpenSearch index creation: {target_index}")

            return DistributionResult(
                True, "opensearch",
                data={
                    "index": target_index,
                    "message": "Index created successfully (simulated)",
                    "shards": 1,
                    "replicas": 1
                }
            )

        except Exception as e:
            error_msg = f"OpenSearch index creation failed: {e!s}"
            logger.error(error_msg)
            return DistributionResult(False, "opensearch", error=error_msg)

    def search_documents(self, query: str, limit: int = 10) -> DistributionResult:
        """Search documents in OpenSearch.
        
        Args:
            query: Search query string
            limit: Maximum number of results to return
            
        Returns:
            DistributionResult with search results
        """
        from .data_distributor import DistributionResult

        if not self.enabled:
            return DistributionResult(
                False, "opensearch",
                error="OpenSearch adapter is disabled"
            )

        try:
            # Simulate search operation
            logger.info(f"Simulating OpenSearch search in index '{self.index_name}': '{query}'")

            # Generate simulated results
            simulated_results = []
            for i in range(min(limit, 5)):  # Return up to 5 simulated results
                simulated_results.append({
                    "_id": str(uuid.uuid4()),
                    "_score": 1.0 - (i * 0.1),  # Decreasing score
                    "_source": {
                        "name": f"Search Result {i+1}",
                        "age": 20 + i,
                        "city": f"Search City {i+1}",
                        "score": 70.0 + (i * 5.0),
                        "source_format": "json"
                    }
                })

            return DistributionResult(
                True, "opensearch",
                data={
                    "index": self.index_name,
                    "query": query,
                    "results": simulated_results,
                    "total_hits": len(simulated_results),
                    "took_milliseconds": 25,  # Simulated
                    "timestamp": datetime.now().isoformat()
                }
            )

        except Exception as e:
            error_msg = f"OpenSearch search failed: {e!s}"
            logger.error(error_msg)
            return DistributionResult(False, "opensearch", error=error_msg)

    def get_index_mapping(self) -> dict[str, Any]:
        """Get the mapping of the target index.
        
        Returns:
            Dictionary representing the index mapping
        """
        return {
            "index": self.index_name,
            "mappings": {
                "properties": {
                    "name": {
                        "type": "text",
                        "fields": {
                            "keyword": {
                                "type": "keyword",
                                "ignore_above": 256
                            }
                        }
                    },
                    "age": {
                        "type": "integer"
                    },
                    "city": {
                        "type": "text",
                        "fields": {
                            "keyword": {
                                "type": "keyword",
                                "ignore_above": 256
                            }
                        }
                    },
                    "score": {
                        "type": "float"
                    },
                    "source_format": {
                        "type": "keyword"
                    },
                    "timestamp": {
                        "type": "date"
                    }
                }
            },
            "settings": {
                "number_of_shards": "1",
                "number_of_replicas": "1"
            }
        }

    def is_healthy(self) -> bool:
        """Check if the OpenSearch adapter is healthy and connected."""
        # In production, this would check the actual OpenSearch connection
        return self.enabled

    def bulk_index(self, documents: list[dict[str, Any]]) -> DistributionResult:
        """Perform bulk indexing of documents.
        
        Args:
            documents: List of documents to index
            
        Returns:
            DistributionResult with bulk indexing status
        """
        from .data_distributor import DistributionResult

        if not self.enabled:
            return DistributionResult(
                False, "opensearch",
                error="OpenSearch adapter is disabled"
            )

        try:
            # Validate documents
            if not documents:
                return DistributionResult(
                    False, "opensearch",
                    error="No documents provided for bulk indexing"
                )

            # Simulate bulk indexing
            doc_count = len(documents)
            logger.info(f"Simulating OpenSearch bulk indexing: {doc_count} documents into index '{self.index_name}'")

            return DistributionResult(
                True, "opensearch",
                data={
                    "index": self.index_name,
                    "documents_processed": doc_count,
                    "successful": doc_count,
                    "failed": 0,
                    "timestamp": datetime.now().isoformat()
                }
            )

        except Exception as e:
            error_msg = f"OpenSearch bulk indexing failed: {e!s}"
            logger.error(error_msg)
            return DistributionResult(False, "opensearch", error=error_msg)

    def refresh_index(self) -> DistributionResult:
        """Refresh the OpenSearch index.
        
        Returns:
            DistributionResult with refresh status
        """
        from .data_distributor import DistributionResult

        if not self.enabled:
            return DistributionResult(
                False, "opensearch",
                error="OpenSearch adapter is disabled"
            )

        try:
            logger.info(f"Simulating OpenSearch index refresh for index '{self.index_name}'")

            return DistributionResult(
                True, "opensearch",
                data={
                    "index": self.index_name,
                    "message": "Index refreshed successfully (simulated)"
                }
            )

        except Exception as e:
            error_msg = f"OpenSearch index refresh failed: {e!s}"
            logger.error(error_msg)
            return DistributionResult(False, "opensearch", error=error_msg)
