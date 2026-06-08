import hashlib
import io
import json
import logging
from typing import Any

import pandas as pd
import redis.asyncio as aioredis

from app.services.embedding_service import get_embedding_service
from app.services.indexing_service import indexing_service
from app.services.registry_fetcher import RegistryFetcher

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

    async def resolve_entities(self, records: list[dict[str, Any]], filename: str, repo: Any, fused_repo: Any, job: Any, db: Any):
        """Perform entity resolution and fetch registry data."""
        unique_ueids = set()
        cache = aioredis.from_url("redis://localhost:6379")

        for i, record in enumerate(records):
            # Try to extract company name and edrpou from common column names
            name = str(record.get("company_name") or record.get("name") or record.get("declarant_name") or "Unknown Entity")
            edrpou = record.get("edrpou") or record.get("inn")

            if edrpou:
                # Clean up numeric representation or float parsing errors
                try:
                    edrpou_str = str(int(float(edrpou)))
                    edrpou = edrpou_str.zfill(8) if len(edrpou_str) <= 8 else edrpou_str
                except (ValueError, TypeError):
                    edrpou = str(edrpou).strip()

            entity, _is_new = await repo.resolve_or_create(
                name=name,
                entity_type="company",
                edrpou=edrpou,
                metadata={"source_file": filename}
            )

            record["ueid"] = str(entity.ueid)
            unique_ueids.add(str(entity.ueid))

            # Fetch public registry data (EDRPOU) with caching
            if edrpou:
                cache_key = f"registry:edrpou:{edrpou}"
                cached = await cache.get(cache_key)
                if cached:
                    registry_data = json.loads(cached)
                else:
                    fetcher = RegistryFetcher()
                    registry_data = await fetcher.fetch_edrpou(edrpou)
                    await cache.setex(cache_key, 86400, json.dumps(registry_data))
                    await fetcher.close()
                record["registry"] = registry_data

            # Store FusedRecord for engines
            fprint = hashlib.md5(str(record).encode("utf-8")).hexdigest()
            await fused_repo.save_record(
                ueid=entity.ueid,
                source="file_upload",
                raw_data=record,
                normalized_data={},
                fingerprint=fprint,
                quality_score=0.75,
            )

            if i % 100 == 0:
                job.progress.current_item = i
                job.progress.message = f"Резолюція UEID: {i}/{len(records)}"
                await db.flush()

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
