import logging

logger = logging.getLogger("app.services.indexing_service")

class IndexingService:
    async def index_document(self, document_id: str):
        logger.info(f"Indexing document {document_id} (Mock)")
        return True

    async def index_documents(self, documents: list, dataset_type: str = "custom"):
        logger.info(f"Indexing {len(documents)} documents of type {dataset_type} (Mock)")
        return {"indexed": len(documents), "status": "success"}

indexing_service = IndexingService()
