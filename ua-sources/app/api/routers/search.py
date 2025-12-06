"""Search Router"""
from fastapi import APIRouter, Query, HTTPException, Depends
from typing import Optional, List, Dict, Any
from app.services.qdrant_service import QdrantService
from app.services.embedding_service import EmbeddingService
from app.services.opensearch_indexer import OpenSearchIndexer
from app.api.routers.metrics import track_search_request
import time
import logging

logger = logging.getLogger("api.search")
router = APIRouter(prefix="/search", tags=["Search"])

# Dependencies
def get_indexer():
    return OpenSearchIndexer()

def get_qdrant():
    return QdrantService()

def get_embedding():
    return EmbeddingService()

@router.get("/")
async def search(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(20, le=100, description="Max results"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    category: Optional[str] = Query(None, description="Filter by category"),
    source: Optional[str] = Query(None, description="Filter by source"),
    mode: str = Query("hybrid", enum=["hybrid", "text", "semantic"], description="Search mode"),
    indexer: OpenSearchIndexer = Depends(get_indexer),
    qdrant: QdrantService = Depends(get_qdrant),
    embedder: EmbeddingService = Depends(get_embedding)
):
    """
    Universal semantic search across all documents.
    Supports full-text search, filtering, and pagination.
    """
    start_time = time.time()
    results = []
    total = 0
    search_type = mode

    try:
        # 1. Text Search (OpenSearch)
        text_hits = []
        if mode in ["hybrid", "text"]:
            # Build query body
            query_body = {
                "from": 0, # Get more candidates for fusion
                "size": limit * 2 if mode == "hybrid" else limit, 
                "query": {
                    "bool": {
                        "must": [
                            {
                                "multi_match": {
                                    "query": q,
                                    "fields": ["title^3", "content", "company_name^2", "edrpou"],
                                    "type": "best_fields",
                                    "fuzziness": "AUTO"
                                }
                            }
                        ],
                        "filter": []
                    }
                },
                "highlight": {
                    "fields": {
                        "content": {"fragment_size": 150, "number_of_fragments": 1},
                        "title": {}
                    }
                }
            }
            
            # Apply filters
            if category:
                query_body["query"]["bool"]["filter"].append({"term": {"category.keyword": category}})
            if source:
                query_body["query"]["bool"]["filter"].append({"term": {"source.keyword": source}})

            os_resp = await indexer.search(index_name="predator-documents", query_body=query_body)
            text_hits = os_resp.get("hits", {}).get("hits", [])
            total = os_resp.get("hits", {}).get("total", {}).get("value", 0)

        # 2. Semantic Search (Qdrant)
        vector_hits = []
        if mode in ["hybrid", "semantic"]:
            try:
                # Generate query embedding
                query_vector = await embedder.generate_embedding_async(q)
                
                # Build filters
                filters = {}
                if category: filters["category"] = category
                # if source: filters["source"] = source # Qdrant schema dependent
                
                vector_hits = await qdrant.search(
                    query_vector=query_vector,
                    limit=limit * 2 if mode == "hybrid" else limit,
                    filter_conditions=filters
                )
                if mode == "semantic":
                    total = len(vector_hits) # Qdrant total is approximate or just list len
            except Exception as e:
                logger.error(f"Semantic search failed: {e}")
                if mode == "semantic": raise e

        # 3. Hybrid Fusion & Reranking
        final_results = []
        
        if mode == "hybrid":
            # Combine results by ID
            merged = {}
            
            # Normalize scores (simple max norm)
            max_text = max([h["_score"] for h in text_hits]) if text_hits else 1.0
            max_vec = max([h["score"] for h in vector_hits]) if vector_hits else 1.0
            
            # Alpha weights
            alpha_text = 0.3
            alpha_vec = 0.7
            
            # Process Text Hits
            for h in text_hits:
                did = h["_id"]
                norm_score = h["_score"] / max_text
                merged[did] = {
                    "id": did,
                    "text_score": norm_score,
                    "vector_score": 0.0,
                    "data": h["_source"],
                    "highlights": h.get("highlight", {})
                }
                
            # Process Vector Hits
            for h in vector_hits:
                did = h["id"]
                norm_score = h["score"] / max_vec
                
                if did in merged:
                    merged[did]["vector_score"] = norm_score
                else:
                    # Need to fetch data for vector-only hits
                    # For MVP, we might skip if not in OpenSearch, or fetch from DB
                    # Here assuming mostly overlap or skipping data-fetch for speed in snippet
                    # Let's try to fetch minimal info if possible or mock
                    merged[did] = {
                        "id": did,
                        "text_score": 0.0,
                        "vector_score": norm_score,
                        "data": h.get("metadata", {}), # Use payload
                        "highlights": {}
                    }
            
            # Calculate final score
            candidates = []
            for did, item in merged.items():
                final_score = (item["text_score"] * alpha_text) + (item["vector_score"] * alpha_vec)
                item["final_score"] = final_score
                candidates.append(item)
            
            # Sort by combined score
            candidates.sort(key=lambda x: x["final_score"], reverse=True)
            top_candidates = candidates[:50] # Rerank top 50
            
            # 4. Reranking (Cross-Encoder)
            # Extract texts for reranking
            docs_to_rank = []
            for cand in top_candidates:
                title = cand["data"].get("title", "")
                content = cand["data"].get("content", "")
                docs_to_rank.append(f"{title} {content}"[:512]) # Truncate for speed
            
            if docs_to_rank:
                rerank_scores = embedder.rerank(q, docs_to_rank)
                for i, score in enumerate(rerank_scores):
                    top_candidates[i]["rerank_score"] = score
                    
                # Final sort by rerank score
                top_candidates.sort(key=lambda x: x.get("rerank_score", 0.0), reverse=True)
            
            final_results = top_candidates[:limit]
            
        elif mode == "text":
            final_results = [
                {
                    "id": h["_id"],
                    "score": h["_score"],
                    "data": h["_source"],
                    "highlights": h.get("highlight", {})
                } for h in text_hits
            ]
            
        elif mode == "semantic":
            final_results = [
                {
                    "id": h["id"],
                    "score": h["score"],
                    "data": h["metadata"],
                    "highlights": {}
                } for h in vector_hits
            ]

        # Format output
        formatted_results = []
        for res in final_results:
            formatted_results.append({
                "id": res["id"],
                "title": res["data"].get("title"),
                "snippet": res["data"].get("description") or res["data"].get("content") or "...", # Fallback
                "score": res.get("rerank_score") or res.get("final_score") or res.get("score"),
                "semanticScore": res.get("vector_score"),
                "source": res["data"].get("source", "unknown"),
                "category": res["data"].get("category", "general"),
                "searchType": mode,
                "combinedScore": res.get("final_score")
            })

        duration = time.time() - start_time
        track_search_request(mode, duration, len(formatted_results))
        
        return {
            "results": formatted_results,
            "total": total if mode == "text" else len(final_results), # Total is tricky in hybrid
            "searchType": mode
        }

    except Exception as e:
        logger.error(f"Search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await indexer.close()


@router.get("/companies")
async def search_companies(
    q: str = Query(..., min_length=1),
    limit: int = 20,
    indexer: OpenSearchIndexer = Depends(get_indexer)
):
    """Specialized search for companies"""
    start_time = time.time()
    try:
        query_body = {
            "size": limit,
            "query": {
                "bool": {
                    "must": [
                        {
                            "multi_match": {
                                "query": q,
                                "fields": ["company_name^3", "edrpou^5", "title"],
                            }
                        }
                    ],
                    "filter": [
                        {"term": {"category.keyword": "company"}}
                    ]
                }
            }
        }
        
        response = await indexer.search("predator-documents", query_body=query_body)
        
        hits = response.get("hits", {}).get("hits", [])
        companies = [h["_source"] for h in hits]
        
        duration = time.time() - start_time
        track_search_request("companies", duration, len(companies))
        
        return {
            "query": q,
            "companies": companies,
            "total": response.get("hits", {}).get("total", {}).get("value", 0)
        }
    except Exception as e:
        logger.error(f"Company search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await indexer.close()


@router.get("/tenders")
async def search_tenders(
    q: str = Query(..., min_length=1),
    limit: int = 20,
    indexer: OpenSearchIndexer = Depends(get_indexer)
):
    """Specialized search for tenders"""
    start_time = time.time()
    try:
        query_body = {
            "size": limit,
            "query": {
                "bool": {
                    "must": [
                        {
                            "multi_match": {
                                "query": q,
                                "fields": ["title^2", "content", "id"],
                            }
                        }
                    ],
                    "filter": [
                        {"term": {"category.keyword": "tender"}}
                    ]
                }
            }
        }
        
        response = await indexer.search("predator-documents", query_body=query_body)
        
        hits = response.get("hits", {}).get("hits", [])
        tenders = [h["_source"] for h in hits]
        
        duration = time.time() - start_time
        track_search_request("tenders", duration, len(tenders))
        
        return {
            "query": q,
            "tenders": tenders,
            "total": response.get("hits", {}).get("total", {}).get("value", 0)
        }
    except Exception as e:
        logger.error(f"Tender search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await indexer.close()


@router.get("/suggest")
async def suggest(
    q: str = Query(..., min_length=1),
    limit: int = 5,
    indexer: OpenSearchIndexer = Depends(get_indexer)
):
    """Search suggestions"""
    try:
        query_body = {
            "size": limit,
            "query": {
                "match_phrase_prefix": {
                    "title": {
                        "query": q,
                        "max_expansions": 10
                    }
                }
            },
            "_source": ["title", "id", "category"]
        }
        response = await indexer.search("predator-documents", query_body=query_body)
        hits = response.get("hits", {}).get("hits", [])
        suggestions = [
            {"text": h["_source"].get("title"), "id": h["_id"], "category": h["_source"].get("category")}
            for h in hits
        ]
        track_search_request("suggestions", 0.1, len(suggestions))
        return suggestions
    except Exception:
        return []
    finally:
        await indexer.close()
