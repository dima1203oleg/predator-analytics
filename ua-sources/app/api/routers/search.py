"""Search Router"""
from fastapi import APIRouter, Query, HTTPException, Depends
from typing import Optional, List, Dict, Any
from app.services.qdrant_service import QdrantService
from app.services.embedding_service import EmbeddingService
from app.services.opensearch_indexer import OpenSearchIndexer
from app.api.routers.metrics import track_search_request
import time
import logging

from pydantic import BaseModel

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
    rerank: bool = Query(True, description="Enable semantic reranking"),
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
                                    "fields": ["title^3", "description^2", "category", "edrpou"],
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
                        "description": {"fragment_size": 150, "number_of_fragments": 1},
                        "title": {}
                    }
                }
            }
            
            # Apply filters
            if category:
                query_body["query"]["bool"]["filter"].append({"term": {"category.keyword": category}})
            if source:
                query_body["query"]["bool"]["filter"].append({"term": {"source.keyword": source}})

            os_resp = await indexer.search(index_name="documents_safe", query_body=query_body)
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

                if mode == "semantic": raise e

        # 3. Hybrid Fusion & Reranking
        print(f"Text hits: {len(text_hits)}, Vector hits: {len(vector_hits)}")
        final_results = []
        
        if mode == "hybrid":
            # Use standard Reciprocal Rank Fusion (RRF)
            from app.services.search_fusion import reciprocal_rank_fusion
            
            # Map Elastic results to Dict format expected by RRF
            os_input = [
                {
                    "id": h["_id"], 
                    "score": h["_score"], 
                    "data": h["_source"], 
                    "highlights": h.get("highlight", {})
                }
                for h in text_hits
            ]
            
            # Map Qdrant results to Dict format
            vec_input = [
                {
                    "id": h["id"], 
                    "score": h["score"], 
                    "data": h["metadata"], 
                    "highlights": {}
                }
                for h in vector_hits
            ]
            
            # Perform Fusion
            top_candidates = reciprocal_rank_fusion(os_input, vec_input, k=60, limit=20)
            print(f"Candidates for reranking (after RRF): {len(top_candidates)}")
            
            # 4. Reranking (Cross-Encoder)
            if rerank and top_candidates:
                try:
                    print("Importing reranker")
                    from app.services.ml import get_reranker
                    reranker = get_reranker()
                    
                    # Prepare docs for reranker (needs title + content)
                    docs_to_rank = []
                    for c in top_candidates:
                        # Ensure 'data' has 'id' for tracking if needed, though we map by list/zip usually.
                        # RerankerService uses 'documents' list.
                        # We pass the 'data' dict which has 'title' and 'content'
                        doc_data = c["data"]
                        doc_data["id"] = c["id"] # Inject ID just in case
                        docs_to_rank.append(doc_data)
                    
                    print(f"Calling rerank service with {len(docs_to_rank)} docs")
                    # Rerank
                    # returns List[Tuple[Dict, float]]
                    ranked_results = reranker.rerank(q, docs_to_rank, top_k=limit, score_field="both")
                    print(f"Rerank returned {len(ranked_results)} results")
                    
                    # Reconstruct sorted results
                    final_results = []
                    cand_map = {c["id"]: c for c in top_candidates}
                    
                    for doc_data, score in ranked_results:
                        did = doc_data.get("id")
                        if did and did in cand_map:
                            cand = cand_map[did]
                            cand["rerank_score"] = float(score)
                            cand["combinedScore"] = float(score) # Use rerank score as final
                            final_results.append(cand)
                            
                except ImportError as e:
                    logger.warning(f"Reranking skipped (import error): {e}")
                    final_results = top_candidates[:limit]
                except Exception as e:
                    logger.error(f"Reranking failed: {e}")
                    import traceback
                    traceback.print_exc()
                    final_results = top_candidates[:limit]
            else:
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
                "combinedScore": res.get("combinedScore", res.get("final_score", 0))
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


class CustomsSearchRequest(BaseModel):
    query: str
    limit: int = 50
    filters: Optional[Dict[str, Any]] = None

@router.post("/customs")
async def customs_search(
    request: CustomsSearchRequest,
    indexer: OpenSearchIndexer = Depends(get_indexer)
):
    """
    Dedicated search for Customs Declarations (ua_customs_imports).
    Uses 'customs' alias for zero-downtime updates.
    Returns search results + analytics (aggregations).
    """
    try:
        query = request.query
        
        # Construct query
        os_query_body = {
            "query": {
                "bool": {
                    "must": [
                        {
                            "multi_match": {
                                "query": query,
                                "fields": [
                                    "опис_товару^2", 
                                    "код_товару^3", 
                                    "торгуюча_країна", 
                                    "митниця_оформлення",
                                    "номер_митної_декларації"
                                ],
                                "type": "best_fields",
                                "operator": "and"
                            }
                        }
                    ],
                    "filter": []
                }
            },
            "size": request.limit,
            "highlight": {
                "fields": {
                    "опис_товару": {"fragment_size": 200, "number_of_fragments": 1},
                    "код_товару": {}
                }
            },
            "aggs": {
                "top_countries": {
                    "terms": {"field": "торгуюча_країна.keyword", "size": 10}
                },
                "top_codes": {
                    "terms": {"field": "код_товару.keyword", "size": 10}
                },
                "top_offices": {
                    "terms": {"field": "митниця_оформлення.keyword", "size": 10}
                }
            }
        }
        
        # Execute search
        response = await indexer.search(
            index_name="customs",
            query_body=os_query_body,
            size=request.limit
        )
        
        hits = response.get("hits", {}).get("hits", [])
        
        # Parse Aggregations
        aggs = response.get("aggregations", {})
        analytics = {
            "top_countries": [
                {"name": b["key"], "count": b["doc_count"]} 
                for b in aggs.get("top_countries", {}).get("buckets", [])
            ],
            "top_codes": [
                {"code": b["key"], "count": b["doc_count"]} 
                for b in aggs.get("top_codes", {}).get("buckets", [])
            ],
            "top_offices": [
                {"name": b["key"], "count": b["doc_count"]} 
                for b in aggs.get("top_offices", {}).get("buckets", [])
            ]
        }
        
        # Map Results
        results = []
        for h in hits:
            source = h.get("_source", {})
            results.append({
                "id": str(source.get("id") or h.get("_id")),
                "description": source.get("опис_товару"),
                "hs_code": source.get("код_товару"),
                "country_trading": source.get("торгуюча_країна"),
                "customs_office": source.get("митниця_оформлення"),
                "decl_number": source.get("номер_митної_декларації"),
                "score": h.get("_score")
            })
            
        return {
            "total": response.get("hits", {}).get("total", {}).get("value", 0),
            "results": results,
            "analytics": analytics
        }

    except Exception as e:
        logger.error(f"Customs search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await indexer.close()
