import logging

logger = logging.getLogger("app.services.indexing_service")

class IndexingService:
    async def index_document(self, document_id: str):
        logger.info(f"Indexing document {document_id} (Mock)")
        return True

indexing_service = IndexingService()
