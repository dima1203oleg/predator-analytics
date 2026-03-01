from __future__ import annotations

import logging
from typing import Any


logger = logging.getLogger("predator.fusion")


class SearchFusion:
    """Search Fusion service for hybrid search with RRF."""

    def __init__(self, k: int = 60, default_limit: int = 20):
        self.k = k
        self.default_limit = default_limit

    def reciprocal_rank_fusion(
        self,
        results_os: list[dict[str, Any]],
        results_vec: list[dict[str, Any]],
        limit: int | None = None,
    ) -> list[dict[str, Any]]:
        """Applies RRF to merge OpenSearch and Qdrant results."""
        limit = limit or self.default_limit
        return reciprocal_rank_fusion(results_os, results_vec, self.k, limit)

    async def hybrid_search(
        self,
        query: str,
        opensearch_results: list[dict[str, Any]] | None = None,
        qdrant_results: list[dict[str, Any]] | None = None,
        limit: int = 20,
    ) -> dict[str, Any]:
        """Performs hybrid search fusion."""
        os_results = opensearch_results or []
        vec_results = qdrant_results or []

        fused = self.reciprocal_rank_fusion(os_results, vec_results, limit)

        return {
            "results": fused,
            "total": len(fused),
            "sources": {"opensearch": len(os_results), "qdrant": len(vec_results)},
        }


def reciprocal_rank_fusion(
    results_os: list[dict[str, Any]],
    results_vec: list[dict[str, Any]],
    k: int = 60,
    limit: int = 20,
) -> list[dict[str, Any]]:
    """Implements Reciprocal Rank Fusion (RRF) algorithm.
    Paper: https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf.

    Args:
        results_os: List of results from OpenSearch (BM25)
        results_vec: List of results from Qdrant (Vector)
        k: Constant for rank smoothing (default 60)
        limit: Max number of merged results to return

    Returns:
        List of fused and sorted documents
    """
    scores = {}
    doc_map = {}

    # Process OpenSearch results
    for rank, doc in enumerate(results_os):
        doc_id = str(doc.get("id"))
        if not doc_id:
            continue

        # Keep document data
        if doc_id not in doc_map:
            doc_map[doc_id] = doc

        # RRF formula: score += 1 / (k + rank)
        scores[doc_id] = scores.get(doc_id, 0.0) + 1.0 / (k + rank)

        # Add debug info
        if "fusion_debug" not in doc_map[doc_id]:
            doc_map[doc_id]["fusion_debug"] = {}
        doc_map[doc_id]["fusion_debug"]["rank_os"] = rank
        doc_map[doc_id]["fusion_debug"]["score_os"] = 1.0 / (k + rank)

    # Process Vector results
    for rank, doc in enumerate(results_vec):
        doc_id = str(doc.get("id"))
        if not doc_id:
            continue

        if doc_id not in doc_map:
            doc_map[doc_id] = doc

        scores[doc_id] = scores.get(doc_id, 0.0) + 1.0 / (k + rank)

        # Add debug info
        if "fusion_debug" not in doc_map[doc_id]:
            doc_map[doc_id]["fusion_debug"] = {}
        doc_map[doc_id]["fusion_debug"]["rank_vec"] = rank
        doc_map[doc_id]["fusion_debug"]["score_vec"] = 1.0 / (k + rank)

    # Sort by final score descending
    sorted_docs = sorted(scores.items(), key=lambda x: x[1], reverse=True)

    # Format output
    final_results = []
    for doc_id, score in sorted_docs[:limit]:
        doc = doc_map[doc_id]
        doc["score"] = score
        doc["fusion_debug"]["final_score"] = score

        # --- V45 XAI Layer: Explainable AI Highlights ---
        # In a production system, this could be a call to LLMService
        # Here we add automated reason highlights based on rank/source
        if "highlight" not in doc:
            doc["highlight"] = {}

        reasons = []
        if "rank_os" in doc["fusion_debug"] and doc["fusion_debug"]["rank_os"] < 3:
            reasons.append("Висока частотність ключових слів (BM25)")
        if "rank_vec" in doc["fusion_debug"] and doc["fusion_debug"]["rank_vec"] < 3:
            reasons.append("Семантична відповідність контексту (Vector)")
        if "rank_os" in doc["fusion_debug"] and "rank_vec" in doc["fusion_debug"]:
            reasons.append("Підтверджено гібридним перехресним аналізом")

        doc["ai_reason"] = (
            " 🔥 " + " | ".join(reasons) if reasons else "Знайдено за непрямими ознаками"
        )

        final_results.append(doc)

    return final_results


async def hybrid_search_with_rrf(
    query: str, limit: int = 20, tenant_id: str = "default", index_name: str = "idx_staging_customs"
) -> dict[str, Any]:
    """Виконує реальний гібридний пошук:
    1. Паралельні запити до OpenSearch та Qdrant.
    2. Об'єднання результатів через RRF (Reciprocal Rank Fusion).
    3. Повернення збагачених результатів з AI-поясненнями.
    """
    import asyncio

    from app.services.embedding_service import get_embedding_service
    from app.services.opensearch_indexer import opensearch_indexer
    from app.services.qdrant_service import get_qdrant_service

    embedder = get_embedding_service()
    qdrant = get_qdrant_service()

    # Генеруємо вектор для Qdrant
    vector = await embedder.generate_embedding_async(query)

    # Паралельне виконання пошуку
    try:
        os_task = opensearch_indexer.search(
            index_name=index_name, query=query, size=limit, tenant_id=tenant_id
        )
        q_task = qdrant.search(
            query_vector=vector, limit=limit, tenant_id=tenant_id, collection_name=index_name
        )

        os_resp, q_results = await asyncio.gather(os_task, q_task)

        # Перетворюємо результати OpenSearch у сумісний формат
        os_hits = []
        for hit in os_resp.get("hits", {}).get("hits", []):
            source = hit["_source"]
            os_hits.append(
                {
                    "id": hit["_id"],
                    "content": source.get("content", ""),
                    "metadata": source,
                    "score": hit["_score"],
                }
            )

        # Перетворюємо результати Qdrant
        vec_hits = []
        for hit in q_results:
            vec_hits.append(
                {
                    "id": hit["id"],
                    "content": hit["metadata"].get("content", ""),
                    "metadata": hit["metadata"],
                    "score": hit["score"],
                }
            )

        # Фінальна фузія
        fusion = SearchFusion()
        result = await fusion.hybrid_search(query, os_hits, vec_hits, limit=limit)

        logger.info(f"🔎 Гібридний пошук завершено: {len(result['results'])} результатів знайдено")
        return result

    except Exception as e:
        logger.exception(f"❌ Помилка гібридного пошуку: {e}")
        return {"results": [], "total": 0, "sources": {"opensearch": 0, "qdrant": 0}}
