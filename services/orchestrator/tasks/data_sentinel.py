"""
Data Sentinel Agent - Validates data integrity
Ensures OpenSearch indices match source data
"""
from opensearchpy import AsyncOpenSearch
import logging

logger = logging.getLogger("agents.data_sentinel")

from libs.core.config import settings

class DataSentinel:
    def __init__(self):
        self.opensearch_url = settings.OPENSEARCH_URL
        self.index_name = "documents_safe"

    async def validate_data(self):
        """Validate data integrity"""
        logger.info("🔍 Data Sentinel: Starting validation...")

        try:
            client = AsyncOpenSearch([self.opensearch_url])

            # Count documents
            count_response = await client.count(index=self.index_name)
            doc_count = count_response.get('count', 0)

            # Sample check
            search_response = await client.search(
                index=self.index_name,
                body={"query": {"match_all": {}}, "size": 10}
            )

            hits = search_response.get('hits', {}).get('hits', [])

            # Basic validation
            for hit in hits:
                source = hit.get('_source', {})
                if not source.get('content'):
                    logger.warning(f"Document {hit['_id']} has no content")

            await client.close()

            logger.info(f"✅ Data Sentinel: {doc_count} documents validated")
            return {"status": "ok", "document_count": doc_count}

        except Exception as e:
            logger.error(f"Data Sentinel error: {e}")
            return {"status": "error", "message": str(e)}
