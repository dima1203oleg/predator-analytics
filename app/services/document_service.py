import logging


logger = logging.getLogger("app.services.document_service")


class DocumentService:
    async def get_document(self, doc_id: str):
        logger.info(f"Getting document {doc_id} (Mock)")
        return {"id": doc_id, "content": "Mock content"}


document_service = DocumentService()
