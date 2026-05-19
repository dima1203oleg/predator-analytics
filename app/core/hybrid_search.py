"""OpenSearch Hybrid Search v63.0-ELITE — BM25 + Vector (RRF).

Reciprocal Rank Fusion (RRF) для гібридного пошуку:
  - BM25: keyword search (OpenSearch text queries)
  - Vector: semantic search (BGE-M3 embeddings через Qdrant)
  - Query rewriting через LLM для покращення пошукових запитів
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Any

from app.core.settings import get_settings

if TYPE_CHECKING:
    from collections.abc import Awaitable, Callable

settings = get_settings()
logger = logging.getLogger(__name__)

# ── Constants ────────────────────────────────────────────────

RRF_K: int = 60  # RRF constant
HYBRID_ALPHA: float = 0.5  # BM25 vs Vector weight (0=vector, 1=BM25)


@dataclass
class SearchResult:
    """Результат гібридного пошуку."""

    doc_id: str
    score: float
    bm25_score: float = 0.0
    vector_score: float = 0.0
    source: str = "hybrid"
    content: dict[str, Any] = field(default_factory=dict)
    highlights: list[str] = field(default_factory=list)


@dataclass
class HybridSearchResponse:
    """Відповідь гібридного пошуку."""

    results: list[SearchResult]
    total: int
    query_rewritten: str | None = None
    latency_ms: float = 0.0
    search_type: str = "hybrid"


# ── Query Rewriter ───────────────────────────────────────────


class QueryRewriter:
    """Покращує пошукові запити через LLM."""

    REWRITE_PROMPT = """Перепиши цей пошуковий запит для кращого пошуку в базі митних даних.
Додай синоніми, альтернативні назви, переклад англійською.
Оригінальний запит: {query}
Переписаний запит:"""

    def __init__(
        self, llm_call: Callable[[str], Awaitable[str]] | None = None
    ) -> None:
        self._llm = llm_call

    async def rewrite(self, query: str) -> str:
        """Переписує запит для кращого пошуку."""
        if self._llm is None:
            return query

        try:
            prompt = self.REWRITE_PROMPT.format(query=query)
            rewritten = await self._llm(prompt)
            logger.info("Query rewritten: '%s' → '%s'", query, rewritten.strip())
            return rewritten.strip()
        except Exception:
            logger.debug("Query rewrite failed, using original", exc_info=True)
            return query


# ── BM25 Searcher ────────────────────────────────────────────


class BM25Searcher:
    """Keyword search через OpenSearch BM25."""

    def __init__(self, opensearch_client: Any) -> None:
        self._os = opensearch_client

    async def search(
        self,
        query: str,
        index: str = "predator-documents",
        fields: list[str] | None = None,
        size: int = 20,
        filters: dict[str, Any] | None = None,
    ) -> list[dict[str, Any]]:
        """Виконує BM25 пошук в OpenSearch."""
        if fields is None:
            fields = ["title^3", "description^2", "content", "company_name^2"]

        body: dict[str, Any] = {
            "size": size,
            "query": {
                "bool": {
                    "must": [
                        {
                            "multi_match": {
                                "query": query,
                                "fields": fields,
                                "type": "best_fields",
                                "fuzziness": "AUTO",
                            }
                        }
                    ]
                }
            },
            "highlight": {
                "fields": {
                    "content": {"fragment_size": 150, "number_of_fragments": 2},
                    "title": {},
                }
            },
        }

        if filters:
            body["query"]["bool"]["filter"] = self._build_filters(filters)

        try:
            response = await self._os.search(index=index, body=body)
            return self._parse_response(response)
        except Exception:
            logger.warning("BM25 search failed", exc_info=True)
            return []

    def _build_filters(self, filters: dict[str, Any]) -> list[dict[str, Any]]:
        """Будує OpenSearch filters."""
        result = []
        for key, value in filters.items():
            if isinstance(value, list):
                result.append({"terms": {key: value}})
            elif isinstance(value, dict) and "gte" in value:
                result.append({"range": {key: value}})
            else:
                result.append({"term": {key: value}})
        return result

    def _parse_response(self, response: dict[str, Any]) -> list[dict[str, Any]]:
        """Парсить OpenSearch відповідь."""
        results = []
        for hit in response.get("hits", {}).get("hits", []):
            results.append({
                "doc_id": hit["_id"],
                "score": hit["_score"],
                "source": hit.get("_source", {}),
                "highlights": [
                    frag for fragments in hit.get("highlight", {}).values()
                    for frag in fragments
                ],
            })
        return results


# ── Vector Searcher ──────────────────────────────────────────


class VectorSearcher:
    """Semantic search через Qdrant embeddings."""

    def __init__(
        self,
        qdrant_client: Any,
        embedding_fn: Callable[[str], Awaitable[list[float]]],
        collection: str = "predator_documents",
    ) -> None:
        self._qdrant = qdrant_client
        self._embed = embedding_fn
        self._collection = collection

    async def search(
        self,
        query: str,
        size: int = 20,
        filters: dict[str, Any] | None = None,
    ) -> list[dict[str, Any]]:
        """Виконує векторний пошук через Qdrant."""
        try:
            embedding = await self._embed(query)
            qdrant_filter = None
            if filters:
                qdrant_filter = {
                    "must": [
                        {"key": k, "match": {"value": v}}
                        for k, v in filters.items()
                    ]
                }

            results = await self._qdrant.search(
                collection_name=self._collection,
                query_vector=embedding,
                limit=size,
                query_filter=qdrant_filter,
            )

            return [
                {
                    "doc_id": r.id,
                    "score": float(r.score),
                    "source": r.payload or {},
                }
                for r in results
            ]
        except Exception:
            logger.warning("Vector search failed", exc_info=True)
            return []


# ── Hybrid Searcher (RRF) ────────────────────────────────────


class HybridSearcher:
    """Головний гібридний пошуковик: BM25 + Vector через RRF."""

    def __init__(
        self,
        bm25: BM25Searcher,
        vector: VectorSearcher,
        rewriter: QueryRewriter | None = None,
    ) -> None:
        self._bm25 = bm25
        self._vector = vector
        self._rewriter = rewriter

    async def search(
        self,
        query: str,
        size: int = 20,
        filters: dict[str, Any] | None = None,
        *,
        rewrite: bool = True,
    ) -> HybridSearchResponse:
        """Виконує гібридний пошук з RRF."""
        import time

        start = time.monotonic()
        rewritten = None

        if rewrite and self._rewriter:
            rewritten = await self._rewriter.rewrite(query)

        search_query = rewritten or query

        # Паралельний пошук
        bm25_results = await self._bm25.search(search_query, size=size * 2, filters=filters)
        vector_results = await self._vector.search(search_query, size=size * 2, filters=filters)

        # RRF fusion
        merged = self._reciprocal_rank_fusion(bm25_results, vector_results, size)

        latency = (time.monotonic() - start) * 1000

        return HybridSearchResponse(
            results=merged,
            total=len(merged),
            query_rewritten=rewritten,
            latency_ms=round(latency, 2),
        )

    def _reciprocal_rank_fusion(
        self,
        bm25_results: list[dict[str, Any]],
        vector_results: list[dict[str, Any]],
        top_k: int,
    ) -> list[SearchResult]:
        """Reciprocal Rank Fusion: об'єднує BM25 + Vector результати."""
        scores: dict[str, dict[str, float]] = {}

        # BM25 scores
        for rank, item in enumerate(bm25_results):
            doc_id = item["doc_id"]
            rrf_score = 1.0 / (RRF_K + rank + 1)
            if doc_id not in scores:
                scores[doc_id] = {"bm25": 0.0, "vector": 0.0}
            scores[doc_id]["bm25"] = rrf_score

        # Vector scores
        for rank, item in enumerate(vector_results):
            doc_id = item["doc_id"]
            rrf_score = 1.0 / (RRF_K + rank + 1)
            if doc_id not in scores:
                scores[doc_id] = {"bm25": 0.0, "vector": 0.0}
            scores[doc_id]["vector"] = rrf_score

        # Combine with weighted sum
        combined = []
        for doc_id, s in scores.items():
            final_score = (
                HYBRID_ALPHA * s["bm25"] + (1 - HYBRID_ALPHA) * s["vector"]
            )
            combined.append((doc_id, final_score, s["bm25"], s["vector"]))

        combined.sort(key=lambda x: x[1], reverse=True)

        # Build SearchResult objects
        doc_map = {}
        for item in bm25_results + vector_results:
            doc_map[item["doc_id"]] = item

        results = []
        for doc_id, score, bm25_s, vec_s in combined[:top_k]:
            doc = doc_map.get(doc_id, {})
            results.append(SearchResult(
                doc_id=doc_id,
                score=round(score, 4),
                bm25_score=round(bm25_s, 4),
                vector_score=round(vec_s, 4),
                content=doc.get("source", {}),
                highlights=doc.get("highlights", []),
            ))

        return results


# ── Factory ──────────────────────────────────────────────────

_hybrid_searcher: HybridSearcher | None = None


def get_hybrid_searcher(
    opensearch_client: Any | None = None,
    qdrant_client: Any | None = None,
    embedding_fn: Callable[[str], Awaitable[list[float]]] | None = None,
    llm_call: Callable[[str], Awaitable[str]] | None = None,
) -> HybridSearcher:
    """Отримати або створити синглтон HybridSearcher."""
    global _hybrid_searcher

    if _hybrid_searcher is not None:
        return _hybrid_searcher

    if opensearch_client is None or qdrant_client is None or embedding_fn is None:
        raise ValueError("opensearch_client, qdrant_client, and embedding_fn are required")

    bm25 = BM25Searcher(opensearch_client)
    vector = VectorSearcher(qdrant_client, embedding_fn)
    rewriter = QueryRewriter(llm_call) if llm_call else None

    _hybrid_searcher = HybridSearcher(bm25, vector, rewriter)
    return _hybrid_searcher
