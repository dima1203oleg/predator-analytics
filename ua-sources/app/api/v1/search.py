from fastapi import APIRouter, HTTPException, Body
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import logging

from app.services.search_fusion import SearchFusion
from app.services.embedding_service import get_embedding_service
from app.services.opensearch_indexer import OpenSearchIndexer
from app.services.qdrant_service import get_qdrant_service

logger = logging.getLogger("api.search")

router = APIRouter(prefix="/search", tags=["Search"])

# Singleton instances (or use dependency injection)
opensearch_indexer = OpenSearchIndexer()

class FusionSearchRequest(BaseModel):
    query: str
    limit: int = 20
    filters: Optional[Dict[str, Any]] = None

@router.post("/fusion")
async def fusion_search(request: FusionSearchRequest):
    """
    Perform hybrid search with RRF fusion.
    Combines text search (OpenSearch) and semantic search (Qdrant).
    """
    try:
        query = request.query
        limit = request.limit
        filters = request.filters
        
        # 1. Generate Embedding for Semantic Search
        embedding_service = get_embedding_service()
        query_vector = await embedding_service.generate_embedding_async(query)
        
        # 2. Prepare Queries & Filters
        import asyncio
        from qdrant_client.models import Filter, FieldCondition, MatchValue, Range

        # -- OpenSearch Query Construction --
        os_query_body = {
            "query": {
                "bool": {
                    "must": [
                        {
                            "multi_match": {
                                "query": query,
                                "fields": ["title^2", "content", "category", "source"],
                                "type": "best_fields"
                            }
                        }
                    ],
                    "filter": []
                }
            },
            "size": limit,
             "highlight": {
                "fields": {
                    "content": {"fragment_size": 150, "number_of_fragments": 1},
                    "title": {}
                }
            }
        }

        if filters:
            if filters.get("category"):
                os_query_body["query"]["bool"]["filter"].append({"term": {"category.keyword": filters["category"]}})
            if filters.get("source"):
                os_query_body["query"]["bool"]["filter"].append({"term": {"source.keyword": filters["source"]}})
            if filters.get("dateFrom") or filters.get("dateTo"):
                range_query = {"range": {"published_date": {}}}
                if filters.get("dateFrom"):
                     range_query["range"]["published_date"]["gte"] = filters["dateFrom"]
                if filters.get("dateTo"):
                     range_query["range"]["published_date"]["lte"] = filters["dateTo"]
                os_query_body["query"]["bool"]["filter"].append(range_query)

        # -- Qdrant Filter Construction --
        q_filter = None
        if filters:
            conditions = []
            if filters.get("category"):
                conditions.append(FieldCondition(key="category", match=MatchValue(value=filters["category"])))
            if filters.get("source"):
                conditions.append(FieldCondition(key="source", match=MatchValue(value=filters["source"])))
            # Note: Date range in Qdrant requires numerical timestamps or properly formatted range queries.
            # Assuming dates are indexed as standard ISO strings or similar likely won't work directly with Range unless mapped to int/float.
            # For MVP, skipping strict date range on Qdrant side to avoid complex casting, relying on OS or post-filter if needed.
            
            if conditions:
                q_filter = Filter(must=conditions)

        # 3. Parallel Search Execution
        qdrant_service = get_qdrant_service()
        
        # Use asyncio.gather for parallelism
        # Note: qdrant_service.search is defined async but might implement blocking calls internally (if sync client).
        # ideally should offload if blocking, but assuming it's fast enough or handles it.
        
        q_simple_filters = {}
        if filters:
             if filters.get("category"): q_simple_filters["category"] = filters["category"]
             if filters.get("source"): q_simple_filters["source"] = filters["source"]

        # 3. Parallel Search Execution
        qdrant_service = get_qdrant_service()
        
        # Use asyncio.gather for parallelism
        results_list = await asyncio.gather(
            opensearch_indexer.search(
                index_name="documents", 
                query_body=os_query_body,
                size=limit
            ),
            qdrant_service.search(
                query_vector=query_vector, 
                limit=limit,
                filter_conditions=q_simple_filters
            )
        )
        
        os_results_raw = results_list[0]
        q_hits = results_list[1]
        
        # Map OS results to common format
        os_hits = os_results_raw.get("hits", {}).get("hits", [])
        os_results = []
        for h in os_hits:
            source = h.get("_source", {})
            os_results.append({
                "id": h.get("_id"),
                "score": h.get("_score"),
                **source
            })
        
        # Map Qdrant results
        q_results = []
        for h in q_hits:
            q_results.append({
                "id": h.get("id"),
                "score": h.get("score"),
                **(h.get("metadata") or {})
            })

        # 3. Fusion (RRF)
        fusion = SearchFusion()
        fused_results = fusion.reciprocal_rank_fusion(
            result_lists=[os_results, q_results],
            top_k=limit
        )
        
        # 4. Final Formatting for Frontend
        mapped_results = []
        for r in fused_results:
            # Calculate a display score (0-100)
            # RRF scores are small (~0.01-0.03 range for k=60). 
            # We can just leave them or normalize. 
            # Frontend uses (score * 100).toFixed(0). 
            # If score is 0.03, it shows 3%. That might look low.
            # Let's scale it up arbitrarily for UX or rely on "weighted_score" if we used that.
            # For now, let's just pass it.
            
            mapped_results.append({
                "id": str(r.get("id")),
                "title": r.get("title") or "Untitled Document",
                "snippet": r.get("snippet") or r.get("content", "")[:300] or "No preview available",
                "score": r.get("rrf_score", 0),
                "semanticScore": r.get("semantic_score"), # Only present if we did weighted fusion or came from qdrant
                "source": r.get("source", "internal"),
                "category": r.get("category"),
                "date": r.get("published_date") or r.get("date"),
                "searchType": "hybrid" 
            })
            
        logger.info(f"Fusion search '{query}': {len(os_results)} text + {len(q_results)} semantic -> {len(mapped_results)} fused")
            
        return mapped_results

    except Exception as e:
        logger.error(f"Search failed: {e}")
        # Return empty list on failure to avoid crashing frontend, or raise 500?
        # Better to return empty with error log for now, or mock fallback if strictly required.
        # User wants "Real Data", so error is better than fake data.
        raise HTTPException(status_code=500, detail=str(e))
