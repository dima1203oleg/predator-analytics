import logging
from typing import Optional, Dict, Any
import uuid
from sqlalchemy.future import select
from sqlalchemy import delete, func, text

from app.database import async_session_maker
from app.models import Document

logger = logging.getLogger("service.document")

class DocumentService:
    """
    Service for managing documents in PostgreSQL gold schema.
    Unified to use SQLAlchemy ORM and shared entities.
    """
    def __init__(self, session=None):
        self.session = session

    def _get_session(self):
        if self.session:
            return self.session
        # This is a bit tricky since we want to use 'async with' usually
        # but for simplicity if self.session exists we use it.
        return None

    async def get_document_by_id(self, doc_id: str) -> Optional[Dict[str, Any]]:
        """Get full document details by ID."""
        # Implement Caching
        try:
            from libs.core.cache import get_cache
            cache = get_cache()
            cached_doc = await cache.get(f"doc:{doc_id}")
            if cached_doc:
                return cached_doc
        except Exception:
            pass # Fail safe if cache generic error

        async with async_session_maker() as session:
            try:
                # doc_id might be string, convert to UUID
                uid = uuid.UUID(doc_id) if isinstance(doc_id, str) else doc_id
                result = await session.execute(select(Document).where(Document.id == uid))
                doc = result.scalars().first()

                if doc:
                    category = None
                    try:
                        if isinstance(doc.meta, dict):
                            category = doc.meta.get("category")
                    except Exception:
                        category = None

                    doc_dict = {
                        "id": str(doc.id),
                        "tenant_id": str(doc.tenant_id),
                        "title": doc.title,
                        "content": doc.content,
                        "source_type": doc.source_type,
                        "source": doc.source_type,
                        "category": category,
                        "meta": doc.meta,
                        "created_at": doc.created_at.isoformat() if doc.created_at else None
                    }

                    # Cache result
                    try:
                        await cache.set(f"doc:{doc_id}", doc_dict, ttl=300) # 5 min cache
                    except Exception:
                        pass

                    return doc_dict
                return None
            except Exception as e:
                logger.error(f"Failed to fetch document {doc_id}: {e}")
                return None

    async def list_documents(
        self,
        tenant_id: Optional[str] = None,
        limit: int = 20,
        offset: int = 0,
        source_type: Optional[str] = None,
        category: Optional[str] = None
    ) -> Dict[str, Any]:
        """List documents with pagination and tenant isolation."""
        async with async_session_maker() as session:
            try:
                query = select(Document)

                if tenant_id:
                    query = query.where(Document.tenant_id == (uuid.UUID(tenant_id) if isinstance(tenant_id, str) else tenant_id))

                if source_type:
                    query = query.where(Document.source_type == source_type)

                if category:
                    # In our model category might be in meta or a separate field
                    # For now check meta as we don't have a separate column in the table shown earlier
                    query = query.where(Document.meta['category'].astext == category)

                # Get total count
                count_query = select(func.count()).select_from(query.subquery())
                total_result = await session.execute(count_query)
                total = total_result.scalar()

                # Get data
                query = query.order_by(Document.created_at.desc()).limit(limit).offset(offset)
                result = await session.execute(query)
                rows = result.scalars().all()

                documents = [
                    {
                        "id": str(doc.id),
                        "tenant_id": str(doc.tenant_id),
                        "title": doc.title,
                        "snippet": (doc.content[:200] + "...") if doc.content else "",
                        "source_type": doc.source_type,
                        "source": doc.source_type,
                        "category": (doc.meta or {}).get("category") if isinstance(doc.meta, dict) else None,
                        "created_at": doc.created_at.isoformat() if doc.created_at else None
                    }
                    for doc in rows
                ]

                return {
                    "documents": documents,
                    "total": total or 0,
                    "limit": limit,
                    "offset": offset
                }
            except Exception as e:
                logger.error(f"Failed to list documents: {e}")
                return {"documents": [], "total": 0, "limit": limit, "offset": offset}

    async def create_document(
        self,
        title: str,
        content: str,
        category: str = "general",
        source_type: str = "manual",
        meta: Dict[str, Any] = None,
        tenant_id: str = "00000000-0000-0000-0000-000000000000"
    ) -> Document:
        """
        Create a new document in the gold schema.
        Returns the created Document object.
        """
        if self.session:
            return await self._do_create_document(
                self.session, title, content, category, source_type, meta, tenant_id
            )

        async with async_session_maker() as session:
            try:
                doc = await self._do_create_document(
                    session, title, content, category, source_type, meta, tenant_id
                )
                await session.commit()
                return doc
            except Exception as e:
                logger.error(f"Failed to create document: {e}")
                raise e

    async def _do_create_document(
        self,
        session: Any,
        title: str,
        content: str,
        category: str,
        source_type: str,
        meta: Dict[str, Any],
        tenant_id: str
    ) -> Document:
        """Internal creation logic."""
        # Ensure tenant_id is UUID
        t_id = uuid.UUID(tenant_id) if isinstance(tenant_id, str) else tenant_id

        doc = Document(
            id=uuid.uuid4(),
            tenant_id=t_id,
            title=title,
            content=content,
            source_type=source_type,
            meta=meta or {}
        )

        # Add category to meta if provided separately
        if category and category != "general":
            if not doc.meta: doc.meta = {}
            doc.meta["category"] = category

        session.add(doc)
        # We don't commit here, let the caller handle it or handle it in create_document
        await session.flush()
        await session.refresh(doc)

        logger.info(f"Buffered document {doc.id} for tenant {tenant_id}")
        return doc

    async def delete_document(self, doc_id: str) -> bool:
        """Delete document."""
        async with async_session_maker() as session:
            try:
                uid = uuid.UUID(doc_id) if isinstance(doc_id, str) else doc_id
                await session.execute(delete(Document).where(Document.id == uid))
                await session.commit()
                return True
            except Exception as e:
                logger.error(f"Failed to delete document {doc_id}: {e}")
                return False

    async def get_summary(self, doc_id: str) -> Optional[Dict[str, Any]]:
        """Get cached summary for a document from gold.document_summaries."""
        async with async_session_maker() as session:
            try:
                uid = uuid.UUID(doc_id) if isinstance(doc_id, str) else doc_id
                result = await session.execute(
                    text(
                        """
                        SELECT summary, model_name, word_count, generated_at
                        FROM gold.document_summaries
                        WHERE document_id = :document_id
                        """
                    ),
                    {"document_id": uid},
                )
                row = result.mappings().first()
                return dict(row) if row else None
            except Exception as e:
                logger.warning(f"Summary cache unavailable for {doc_id}: {e}")
                return None

    async def save_summary(self, doc_id: str, summary: str, model_name: str = "unknown", word_count: Optional[int] = None) -> None:
        """Upsert summary into gold.document_summaries. Best-effort (never raises)."""
        async with async_session_maker() as session:
            try:
                uid = uuid.UUID(doc_id) if isinstance(doc_id, str) else doc_id
                await session.execute(
                    text(
                        """
                        INSERT INTO gold.document_summaries (document_id, summary, model_name, word_count)
                        VALUES (:document_id, :summary, :model_name, :word_count)
                        ON CONFLICT (document_id)
                        DO UPDATE SET
                            summary = EXCLUDED.summary,
                            model_name = EXCLUDED.model_name,
                            word_count = EXCLUDED.word_count,
                            generated_at = NOW()
                        """
                    ),
                    {
                        "document_id": uid,
                        "summary": summary,
                        "model_name": model_name,
                        "word_count": word_count,
                    },
                )
                await session.commit()
            except Exception as e:
                logger.warning(f"Failed to save summary cache for {doc_id}: {e}")
                try:
                    await session.rollback()
                except Exception:
                    pass

# Singleton instance
document_service = DocumentService()
