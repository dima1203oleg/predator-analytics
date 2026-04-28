"""RAG Service — PREDATOR Analytics v61.0-ELITE.

Retrieval-Augmented Generation pipeline:
1. Document chunking (512 tokens, 50 token overlap)
2. Embedding generation через LiteLLM/nomic-embed-text
3. Vector retrieval → context injection → LLM generation
4. Citation tracking для верифікації відповідей

Модуль відповідає:
- FR-050: Knowledge Base для AI Copilot
- TZ §6.2: RAG pipeline з автоматичним citation tracking
"""
from dataclasses import dataclass, field
from typing import Any
from uuid import uuid4

from app.config import get_settings
from app.services.ai_service import AIService
from app.services.qdrant_service import COLLECTION_KNOWLEDGE, qdrant_service
from predator_common.logging import get_logger

logger = get_logger("rag_service")
settings = get_settings()

# Параметри чанкінгу
CHUNK_SIZE = 512      # ~512 tokens (приблизно 2048 символів)
CHUNK_OVERLAP = 50    # Overlap між чанками
CHAR_PER_TOKEN = 4    # Приблизне співвідношення символ/токен


@dataclass
class DocumentChunk:
    """Чанк документа для індексації."""

    chunk_id: str
    document_id: str
    content: str
    metadata: dict[str, Any] = field(default_factory=dict)
    chunk_index: int = 0
    total_chunks: int = 0


@dataclass
class Citation:
    """Цитата з джерела."""

    document_id: str
    chunk_id: str
    content_snippet: str
    relevance_score: float
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass
class RAGResponse:
    """Відповідь RAG pipeline."""

    answer: str
    citations: list[Citation]
    model_used: str
    context_chunks: int
    total_tokens_estimated: int = 0


class RAGService:
    """RAG Pipeline з Qdrant + LiteLLM.

    Підтримує:
    - Автоматичний chunking документів
    - Семантичний пошук через Qdrant
    - Context-aware generation з LiteLLM
    - Citation tracking для верифікації
    """

    # ------------------------------------------------------------------
    # Chunking
    # ------------------------------------------------------------------

    @staticmethod
    def chunk_text(
        text: str,
        chunk_size: int = CHUNK_SIZE,
        overlap: int = CHUNK_OVERLAP,
    ) -> list[str]:
        """Розбиття тексту на чанки з overlap.

        Алгоритм:
        1. Розбиття по реченнях (. ! ?)
        2. Групування речень до chunk_size токенів
        3. Overlap останніх overlap токенів попереднього чанку
        """
        if not text or not text.strip():
            return []

        # Наближений розрахунок символів
        char_limit = chunk_size * CHAR_PER_TOKEN
        overlap_chars = overlap * CHAR_PER_TOKEN

        # Розбиваємо по абзацах спочатку
        paragraphs = text.split("\n")
        sentences: list[str] = []
        for para in paragraphs:
            para = para.strip()
            if para:
                sentences.append(para)

        chunks: list[str] = []
        current_chunk: list[str] = []
        current_length = 0

        for sentence in sentences:
            sentence_len = len(sentence)

            if current_length + sentence_len > char_limit and current_chunk:
                # Зберегти поточний чанк
                chunks.append("\n".join(current_chunk))

                # Overlap: взяти останні речення для контексту
                overlap_text = "\n".join(current_chunk)
                if len(overlap_text) > overlap_chars:
                    overlap_text = overlap_text[-overlap_chars:]

                current_chunk = [overlap_text] if overlap_chars > 0 else []
                current_length = len(overlap_text) if overlap_chars > 0 else 0

            current_chunk.append(sentence)
            current_length += sentence_len

        # Залишок
        if current_chunk:
            chunks.append("\n".join(current_chunk))

        return chunks

    # ------------------------------------------------------------------
    # Індексація документів
    # ------------------------------------------------------------------

    async def index_document(
        self,
        document_id: str,
        content: str,
        tenant_id: str,
        metadata: dict[str, Any] | None = None,
    ) -> list[DocumentChunk]:
        """Індексація документа: chunking → embedding → Qdrant upsert."""
        chunks_text = self.chunk_text(content)
        if not chunks_text:
            logger.warning(f"Документ {document_id} порожній — пропускаємо")
            return []

        doc_chunks: list[DocumentChunk] = []
        points: list[dict[str, Any]] = []

        for i, chunk_text in enumerate(chunks_text):
            chunk_id = f"{document_id}_chunk_{i}"

            # Embedding
            embedding = await AIService.get_embeddings(chunk_text)

            chunk = DocumentChunk(
                chunk_id=chunk_id,
                document_id=document_id,
                content=chunk_text,
                metadata=metadata or {},
                chunk_index=i,
                total_chunks=len(chunks_text),
            )
            doc_chunks.append(chunk)

            points.append({
                "id": str(uuid4()),
                "vector": embedding,
                "payload": {
                    "chunk_id": chunk_id,
                    "document_id": document_id,
                    "content": chunk_text,
                    "chunk_index": i,
                    "total_chunks": len(chunks_text),
                    "tenant_id": tenant_id,
                    "entity_type": "knowledge",
                    **(metadata or {}),
                },
            })

        # Batch upsert у Qdrant
        success = await qdrant_service.upsert_vectors(COLLECTION_KNOWLEDGE, points)
        if success:
            logger.info(
                f"Документ {document_id} проіндексовано: {len(doc_chunks)} чанків",
            )
        else:
            logger.error(f"Помилка індексації документа {document_id}")

        return doc_chunks

    # ------------------------------------------------------------------
    # Retrieval + Generation
    # ------------------------------------------------------------------

    async def query(
        self,
        question: str,
        tenant_id: str,
        top_k: int = 5,
        score_threshold: float = 0.4,
        model: str | None = None,
    ) -> RAGResponse:
        """RAG query: retrieve → augment → generate.

        Args:
            question: Питання користувача
            tenant_id: Tenant для ізоляції
            top_k: Кількість чанків для контексту
            score_threshold: Мінімальний поріг релевантності
            model: LLM модель (за замовчуванням з config)
        """
        # 1. Embedding запитання
        query_embedding = await AIService.get_embeddings(question)

        # 2. Семантичний пошук у Qdrant
        search_result = await qdrant_service.search(
            collection=COLLECTION_KNOWLEDGE,
            query_vector=query_embedding,
            tenant_id=tenant_id,
            limit=top_k,
            score_threshold=score_threshold,
        )

        # 3. Формування контексту з citations
        citations: list[Citation] = []
        context_parts: list[str] = []

        for i, hit in enumerate(search_result.hits, 1):
            content = hit.payload.get("content", "")
            doc_id = hit.payload.get("document_id", "unknown")
            chunk_id = hit.payload.get("chunk_id", "unknown")

            context_parts.append(f"[Джерело {i}] ({doc_id}):\n{content}")

            citations.append(Citation(
                document_id=doc_id,
                chunk_id=chunk_id,
                content_snippet=content[:200],
                relevance_score=hit.score,
                metadata=hit.payload,
            ))

        context = "\n\n---\n\n".join(context_parts) if context_parts else ""

        # 4. Генерація відповіді з контекстом
        target_model = model or settings.OLLAMA_MODEL

        system_prompt = (
            "Ти — аналітик платформи PREDATOR Analytics. "
            "Відповідай ВИКЛЮЧНО українською мовою. "
            "Використовуй надані джерела для відповіді. "
            "Якщо джерела недостатні, вкажи це явно. "
            "Посилайся на джерела як [Джерело N]."
        )

        if context:
            user_prompt = f"Контекст з бази знань:\n\n{context}\n\n---\n\nПитання: {question}"
        else:
            user_prompt = (
                f"Питання: {question}\n\n"
                "(Увага: релевантних джерел у базі знань не знайдено. "
                "Відповідай на основі загальних знань, вказавши це.)"
            )

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]

        answer = await AIService.chat_completion(messages, model=target_model)

        return RAGResponse(
            answer=answer,
            citations=citations,
            model_used=target_model,
            context_chunks=len(context_parts),
            total_tokens_estimated=len(user_prompt) // CHAR_PER_TOKEN,
        )

    # ------------------------------------------------------------------
    # Видалення
    # ------------------------------------------------------------------

    async def delete_document(
        self,
        document_id: str,
        tenant_id: str,
    ) -> bool:
        """Видалити всі чанки документа з Qdrant."""
        return await qdrant_service.delete_by_filter(
            collection=COLLECTION_KNOWLEDGE,
            tenant_id=tenant_id,
            entity_ueid=document_id,
        )


# Singleton
rag_service = RAGService()
