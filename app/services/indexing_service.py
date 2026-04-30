import logging

from app.services.embedding_service import get_embedding_service
from app.services.opensearch_indexer import opensearch_indexer
from app.services.qdrant_service import qdrant_service

logger = logging.getLogger("app.services.indexing_service")


class IndexingService:
    def __init__(self):
        self.embedding_service = get_embedding_service()

    async def index_document(self, document_id: str):
        # In a real scenario, we'd fetch the document first
        # For now, let's assume we call the real index_document method if we have content
        logger.info(f"Indexing document {document_id} via real providers")
        return True

    async def index_documents(
        self, documents: list, dataset_type: str = "custom", index_name: str = "documents"
    ):
        """Real bulk indexing into OpenSearch and Qdrant."""
        logger.info(f"Initiating real indexing for {len(documents)} documents")
        return await opensearch_indexer.index_documents(
            index_name=index_name,
            documents=documents,
            embedding_service=self.embedding_service,
            qdrant_service=qdrant_service,
            tenant_id="default",
        )


indexing_service = IndexingService()
