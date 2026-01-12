import hashlib
import shutil
from pathlib import Path
from typing import Optional, Any
import uuid
from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from .models import FileRegistry, IngestionStatus
from .parsers.excel import ExcelParser
from app.services.document_service import DocumentService
from app.services.opensearch_indexer import opensearch_indexer

UPLOAD_DIR = Path("/opt/predator/data/raw") # Server path
# Fallback for local dev if /opt not exists
if not UPLOAD_DIR.exists():
    UPLOAD_DIR = Path("data/raw")
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

class IngestionManager:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def handle_upload(self, file: UploadFile, tenant_id: str = "default") -> FileRegistry:
        """
        Orchestrates the upload process:
        1. Calculate hash (streaming)
        2. Check deduplication
        3. Save to disk
        4. Register in DB
        """
        # 1. Calculate Hash & Size
        content_hash = hashlib.md5()
        size = 0

        # We need to save to a temp file first to calculate hash without loading likely large file into RAM
        temp_path = UPLOAD_DIR / f"temp_{file.filename}"

        try:
            with open(temp_path, "wb") as buffer:
                while chunk := await file.read(8192):
                    content_hash.update(chunk)
                    buffer.write(chunk)
                    size += len(chunk)
        except Exception:
            return None # Handle error
        finally:
            await file.seek(0) # Reset if needed, though we consumed it

        final_hash = content_hash.hexdigest()

        # 2. Check Deduplication
        existing = await self._get_by_hash(final_hash)
        if existing:
            # Clean up temp file
            temp_path.unlink(missing_ok=True)
            if existing.status == IngestionStatus.FAILED:
                # Retry logic could go here, for now return existing
                pass
            return existing

        # 3. Move to permanent storage
        file_ext = Path(file.filename).suffix
        storage_filename = f"{final_hash}{file_ext}"
        storage_path = UPLOAD_DIR / storage_filename

        shutil.move(str(temp_path), str(storage_path))

        # 4. Create DB Record
        record = FileRegistry(
            id=uuid.uuid4(),
            filename=file.filename,
            file_size_bytes=size,
            content_hash=final_hash,
            storage_path=str(storage_path),
            mime_type=file.content_type,
            tenant_id=uuid.UUID(tenant_id) if isinstance(tenant_id, str) else tenant_id,
            status=IngestionStatus.PENDING
        )
        self.db.add(record)
        await self.db.commit()
        await self.db.refresh(record)

        return record

    async def _get_by_hash(self, hash_str: str) -> Optional[FileRegistry]:
        result = await self.db.execute(select(FileRegistry).filter(FileRegistry.content_hash == hash_str))
        return result.scalars().first()

    async def process_file(self, record_id: Any, tenant_id: str = "00000000-0000-0000-0000-000000000000"):
        """
        This would be called by a Background Task or Celery Worker.
        For v25 MVP, we can call it directly or via FastAPI BackgroundTasks.
        """
        record = await self.db.get(FileRegistry, record_id)
        if not record:
            return

        request_update = False
        try:
            record.status = IngestionStatus.PROCESSING
            await self.db.commit()

            # Logic to select parser based on mime/ext
            file_path = Path(record.storage_path)

            if file_path.suffix in ['.xlsx', '.xls', '.csv']:
                parser = ExcelParser(file_path)
                data = parser.parse()

                # Inyest into Gold Layer
                doc_service = DocumentService(self.db)

                for row in data:
                    # Create document in Postgres
                    doc_meta = {**row, "source_file_id": record_id}
                    title = row.get("title") or row.get("name") or f"Row from {record.filename}"
                    content = " ".join([str(v) for v in row.values()])

                    doc = await doc_service.create_document(
                        title=title,
                        content=content,
                        category=row.get("category", "general"),
                        source_type="file",
                        meta=doc_meta,
                        tenant_id=tenant_id
                    )

                    # Index in OpenSearch
                    await opensearch_indexer.index_document(
                        doc_id=doc.id,
                        title=title,
                        content=content,
                        metadata={**doc_meta, "tenant_id": tenant_id},
                        tenant_id=tenant_id
                    )

                record.metadata_json = {
                    "rows_processed": len(data),
                    "columns": list(data[0].keys()) if data else [],
                    "tenant_id": tenant_id
                }

            record.status = IngestionStatus.COMPLETED
        except Exception as e:
            record.status = IngestionStatus.FAILED
            record.error_message = str(e)
        finally:
            await self.db.commit()
