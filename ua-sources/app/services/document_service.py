"""
Document Service - Repository for Gold schema documents
Handles document CRUD operations from PostgreSQL gold.documents
"""
import os
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime
import asyncpg

logger = logging.getLogger("service.document")


class DocumentService:
    """
    Service for managing documents in PostgreSQL gold schema.
    TS-compliant: Provides actual data retrieval for /documents/{id} endpoint.
    """
    
    def __init__(self):
        self.db_url = os.getenv(
            "DATABASE_URL", 
            "postgresql://predator:predator_password@localhost:5432/predator_db"
        )
        self._pool: Optional[asyncpg.Pool] = None
    
    async def _get_pool(self) -> asyncpg.Pool:
        """Get or create connection pool."""
        if self._pool is None:
            self._pool = await asyncpg.create_pool(
                self.db_url,
                min_size=2,
                max_size=10
            )
        return self._pool
    
    async def get_document_by_id(self, doc_id: str) -> Optional[Dict[str, Any]]:
        """
        Get full document details by ID from gold.documents.
        
        Args:
            doc_id: Document identifier (UUID)
        
        Returns:
            Complete document with all fields or None if not found
        """
        pool = await self._get_pool()
        
        try:
            async with pool.acquire() as conn:
                row = await conn.fetchrow("""
                    SELECT 
                        id,
                        title,
                        content,
                        author,
                        published_date,
                        category,
                        source_url as source,
                        raw_id,
                        created_at,
                        updated_at
                    FROM gold.documents
                    WHERE id = $1
                """, doc_id)
                
                if row:
                    return {
                        "id": str(row["id"]),
                        "title": row["title"],
                        "content": row["content"],
                        "author": row["author"],
                        "published_date": row["published_date"].isoformat() if row["published_date"] else None,
                        "category": row["category"],
                        "source": row["source"],
                        "created_at": row["created_at"].isoformat() if row["created_at"] else None,
                        "updated_at": row["updated_at"].isoformat() if row["updated_at"] else None
                    }
                return None
                
        except Exception as e:
            logger.error(f"Failed to fetch document {doc_id}: {e}")
            return None
    
    async def list_documents(
        self, 
        limit: int = 20, 
        offset: int = 0,
        category: Optional[str] = None,
        source: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        List documents with pagination and filters.
        
        Args:
            limit: Max number of results
            offset: Pagination offset
            category: Filter by category
            source: Filter by source
        
        Returns:
            {documents: [...], total: int, limit: int, offset: int}
        """
        pool = await self._get_pool()
        
        try:
            async with pool.acquire() as conn:
                # Build WHERE clause
                conditions = []
                params = []
                param_idx = 1
                
                if category:
                    conditions.append(f"category = ${param_idx}")
                    params.append(category)
                    param_idx += 1
                
                if source:
                    conditions.append(f"source_url = ${param_idx}")
                    params.append(source)
                    param_idx += 1
                
                where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
                
                # Get total count
                count_query = f"SELECT COUNT(*) FROM gold.documents {where_clause}"
                total = await conn.fetchval(count_query, *params)
                
                # Get documents
                params.extend([limit, offset])
                query = f"""
                    SELECT 
                        id,
                        title,
                        SUBSTRING(content, 1, 200) as snippet,
                        author,
                        published_date,
                        category,
                        source_url as source,
                        created_at
                    FROM gold.documents
                    {where_clause}
                    ORDER BY created_at DESC
                    LIMIT ${param_idx} OFFSET ${param_idx + 1}
                """
                
                rows = await conn.fetch(query, *params)
                
                documents = [
                    {
                        "id": str(row["id"]),
                        "title": row["title"],
                        "snippet": row["snippet"] + "..." if row["snippet"] else "",
                        "author": row["author"],
                        "published_date": row["published_date"].isoformat() if row["published_date"] else None,
                        "category": row["category"],
                        "source": row["source"]
                    }
                    for row in rows
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
        author: Optional[str] = None,
        published_date: Optional[datetime] = None,
        category: Optional[str] = None,
        source: str = "manual",
        raw_id: Optional[int] = None
    ) -> Optional[str]:
        """
        Create a new document in gold.documents.
        
        Returns:
            Document ID (UUID) or None if failed
        """
        pool = await self._get_pool()
        
        try:
            async with pool.acquire() as conn:
                doc_id = await conn.fetchval("""
                    INSERT INTO gold.documents 
                        (title, content, author, published_date, category, source_url, raw_id)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    RETURNING id
                """, title, content, author, published_date, category, source, raw_id)
                
                logger.info(f"Created document: {doc_id}")
                return str(doc_id)
                
        except Exception as e:
            logger.error(f"Failed to create document: {e}")
            return None
    
    async def update_document(
        self,
        doc_id: str,
        updates: Dict[str, Any]
    ) -> bool:
        """
        Update document fields.
        
        Args:
            doc_id: Document ID
            updates: Dict of field -> value to update
        
        Returns:
            True if updated, False otherwise
        """
        allowed_fields = {"title", "content", "author", "published_date", "category", "source"}
        filtered_updates = {k: v for k, v in updates.items() if k in allowed_fields}
        
        if not filtered_updates:
            return False
        
        pool = await self._get_pool()
        
        try:
            async with pool.acquire() as conn:
                set_clauses = []
                params = []
                
                for idx, (field, value) in enumerate(filtered_updates.items(), 1):
                    set_clauses.append(f"{field} = ${idx}")
                    params.append(value)
                
                params.append(doc_id)
                
                query = f"""
                    UPDATE gold.documents 
                    SET {', '.join(set_clauses)}, updated_at = NOW()
                    WHERE id = ${len(params)}
                """
                
                result = await conn.execute(query, *params)
                return result == "UPDATE 1"
                
        except Exception as e:
            logger.error(f"Failed to update document {doc_id}: {e}")
            return False
    
    async def delete_document(self, doc_id: str) -> bool:
        """
        Delete document from gold.documents and related embeddings.
        
        Args:
            doc_id: Document ID
        
        Returns:
            True if deleted, False otherwise
        """
        pool = await self._get_pool()
        
        try:
            async with pool.acquire() as conn:
                # Delete embedding first (FK constraint)
                await conn.execute("DELETE FROM gold.embeddings WHERE doc_id = $1", doc_id)
                
                # Delete document
                result = await conn.execute("DELETE FROM gold.documents WHERE id = $1", doc_id)
                
                if result == "DELETE 1":
                    logger.info(f"Deleted document: {doc_id}")
                    return True
                return False
                
        except Exception as e:
            logger.error(f"Failed to delete document {doc_id}: {e}")
            return False
    
    async def get_summary(self, doc_id: str) -> Optional[Dict[str, Any]]:
        """
        Get cached summary for a document.
        """
        pool = await self._get_pool()
        try:
            async with pool.acquire() as conn:
                row = await conn.fetchrow("""
                    SELECT summary, model_name, word_count
                    FROM document_summaries
                    WHERE document_id = $1
                """, doc_id)
                if row:
                    return dict(row)
                return None
        except Exception as e:
            logger.error(f"Failed to fetch summary for {doc_id}: {e}")
            return None

    async def save_summary(self, doc_id: str, summary: str, model_name: str = "bart-large-cnn", word_count: int = 0) -> bool:
        """
        Save summary to database.
        """
        pool = await self._get_pool()
        try:
            async with pool.acquire() as conn:
                await conn.execute("""
                    INSERT INTO document_summaries (document_id, summary, model_name, word_count)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT (document_id) DO UPDATE
                    SET summary = EXCLUDED.summary,
                        model_name = EXCLUDED.model_name,
                        word_count = EXCLUDED.word_count,
                        generated_at = NOW()
                """, doc_id, summary, model_name, word_count)
                return True
        except Exception as e:
            logger.error(f"Failed to save summary for {doc_id}: {e}")
            return False

    async def close(self):
        """Close connection pool."""
        if self._pool:
            await self._pool.close()
            self._pool = None


# Singleton instance
document_service = DocumentService()
