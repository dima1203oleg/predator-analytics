from typing import List, Dict, Any
import logging

logger = logging.getLogger("predator.fusion")


class SearchFusion:
    """Search Fusion service for hybrid search with RRF"""
    
    def __init__(self, k: int = 60, default_limit: int = 20):
        self.k = k
        self.default_limit = default_limit
    
    def reciprocal_rank_fusion(
        self,
        results_os: List[Dict[str, Any]], 
        results_vec: List[Dict[str, Any]], 
        limit: int = None
    ) -> List[Dict[str, Any]]:
        """Applies RRF to merge OpenSearch and Qdrant results"""
        limit = limit or self.default_limit
        return reciprocal_rank_fusion(results_os, results_vec, self.k, limit)
    
    async def hybrid_search(
        self,
        query: str,
        opensearch_results: List[Dict[str, Any]] = None,
        qdrant_results: List[Dict[str, Any]] = None,
        limit: int = 20
    ) -> Dict[str, Any]:
        """Performs hybrid search fusion"""
        os_results = opensearch_results or []
        vec_results = qdrant_results or []
        
        fused = self.reciprocal_rank_fusion(os_results, vec_results, limit)
        
        return {
            "results": fused,
            "total": len(fused),
            "sources": {
                "opensearch": len(os_results),
                "qdrant": len(vec_results)
            }
        }


def reciprocal_rank_fusion(
    results_os: List[Dict[str, Any]], 
    results_vec: List[Dict[str, Any]], 
    k: int = 60,
    limit: int = 20
) -> List[Dict[str, Any]]:
    """
    Implements Reciprocal Rank Fusion (RRF) algorithm.
    Paper: https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf
    
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
        if not doc_id: continue
        
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
        if not doc_id: continue
        
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
        final_results.append(doc)
        
    return final_results

async def hybrid_search_with_rrf(
    query: str,
    limit: int = 20,
    opensearch_client = None,
    qdrant_client = None
) -> Dict[str, Any]:
    """
    Performs hybrid search by querying both engines in parallel and fusing results.
    Note: This is a placeholder. Actual implementation requires passing service instances.
    In real usage, this logic resides in the SearchRouter or a dedicated Orchestrator.
    """
    pass
