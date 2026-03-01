import io
import logging
from typing import Any

import pandas as pd

from app.services.embedding_service import get_embedding_service
from app.services.indexing_service import indexing_service


logger = logging.getLogger(__name__)


class IngestionService:
    """Business logic for data ingestion.
    Handles file parsing, validation, and chunking.
    """

    async def validate_file(self, content: bytes, file_type: str) -> bool:
        """Validate file content integrity."""
        if file_type in [".xlsx", ".xls"]:
            try:
                # Try to read header only
                pd.read_excel(io.BytesIO(content), nrows=5)
                return True
            except Exception as e:
                raise ValueError(f"Invalid Excel file: {e!s}")

        elif file_type == ".csv":
            try:
                pd.read_csv(io.BytesIO(content), nrows=5)
                return True
            except Exception as e:
                raise ValueError(f"Invalid CSV file: {e!s}")

        elif file_type == ".json":
            import json

            try:
                json.loads(content)
                return True
            except Exception as e:
                raise ValueError(f"Invalid JSON file: {e!s}")

        return True

    async def parse_excel(self, content: bytes, filename: str) -> list[dict[str, Any]]:
        """Parse Excel/CSV file into list of records.
        Handles large files by reading in chunks if necessary (for now full read).
        """
        try:
            df = (
                pd.read_csv(io.BytesIO(content))
                if filename.endswith(".csv")
                else pd.read_excel(io.BytesIO(content))
            )

            # Basic cleaning
            df = df.where(pd.notnull(df), None)

            # Convert dates to ISO format
            for col in df.columns:
                if pd.api.types.is_datetime64_any_dtype(df[col]):
                    df[col] = df[col].dt.isoformat()

            return df.to_dict("records")

        except Exception as e:
            logger.exception(f"Error parsing Excel file {filename}: {e}")
            raise ValueError(f"Failed to parse file: {e!s}")

    async def parse_document(self, content: bytes, file_type: str) -> list[dict[str, Any]]:
        """Parse text documents (mock implementation for now)."""
        text = content.decode("utf-8", errors="ignore")
        return [{"content": text, "type": "document"}]

    async def parse_pdf(self, content: bytes) -> list[dict[str, Any]]:
        """Parse PDF (mock implementation)."""
        # Placeholder: In real prod, integrate PyMuPDF or similar here
        return [{"content": "PDF content placeholder", "type": "pdf"}]

    async def parse_image_ocr(self, content: bytes) -> list[dict[str, Any]]:
        """OCR for images (mock implementation)."""
        return [{"content": "OCR content placeholder", "type": "image"}]

    async def create_chunks(
        self, records: list[dict[str, Any]], chunk_size: int = 100
    ) -> list[list[dict[str, Any]]]:
        """Split records into chunks for processing."""
        return [records[i : i + chunk_size] for i in range(0, len(records), chunk_size)]

    async def create_embedding(self, chunk: list[dict[str, Any]]):
        """Generate embeddings for a chunk via real EmbeddingService."""
        service = get_embedding_service()
        for doc in chunk:
            text = f"{doc.get('title', '')} {doc.get('content', '')}".strip()
            if text:
                doc["embedding"] = await service.generate_embedding_async(text)

    async def index_chunk(self, chunk: list[dict[str, Any]]):
        """Index chunk into Vector DB / Search Engine using real IndexingService."""
        await indexing_service.index_documents(chunk)

    async def save_dataset_metadata(
        self, job_id: str, filename: str, records_count: int, user_id: str, dataset_name: str | None
    ):
        """Finalize ingestion by saving metadata to DB."""
        # Placeholder for DB save
        logger.info(f"Dataset {dataset_name or filename} saved. Records: {records_count}")
