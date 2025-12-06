"""
Search Fusion Service
Implements Reciprocal Rank Fusion (RRF) for combining multiple search results
"""
from typing import List, Dict, Any, Tuple
import logging

logger = logging.getLogger("service.search_fusion")


class SearchFusion:
    """
    Combines results from multiple search engines using fusion algorithms.
    
    Supports:
    - Reciprocal Rank Fusion (RRF) - recommended
    - Weighted Score Fusion
    """
    
    def __init__(self, k: int = 60):
        """
        Initialize fusion service.
        
        Args:
            k: RRF constant (higher k = more weight to lower-ranked results)
        """
        self.k = k
    
    def reciprocal_rank_fusion(
        self,
        result_lists: List[List[Dict[str, Any]]],
        id_field: str = "id",
        top_k: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Combine multiple ranked lists using Reciprocal Rank Fusion.
        
        Formula: score(d) = Σ 1 / (k + rank(d))
        
        Proven to outperform simple score averaging in most cases.
        
        Args:
            result_lists: List of result lists from different sources
            id_field: Field name containing document ID
            top_k: Number of results to return
        
        Returns:
            Fused list sorted by combined RRF score
        """
        # Collect all document scores
        doc_scores: Dict[str, float] = {}
        doc_data: Dict[str, Dict[str, Any]] = {}
        
        for results in result_lists:
            for rank, doc in enumerate(results, start=1):
                doc_id = str(doc.get(id_field, ""))
                if not doc_id:
                    continue
                
                # RRF score contribution from this list
                rrf_score = 1.0 / (self.k + rank)
                
                # Accumulate scores
                doc_scores[doc_id] = doc_scores.get(doc_id, 0.0) + rrf_score
                
                # Store document data (last one wins if duplicates)
                if doc_id not in doc_data:
                    doc_data[doc_id] = dict(doc)
        
        # Sort by combined RRF score
        sorted_ids = sorted(doc_scores.keys(), key=lambda x: doc_scores[x], reverse=True)
        
        # Build result list
        results = []
        for doc_id in sorted_ids[:top_k]:
            doc = doc_data[doc_id]
            doc["rrf_score"] = doc_scores[doc_id]
            doc["fusion_method"] = "rrf"
            results.append(doc)
        
        logger.info(f"RRF fusion: {sum(len(r) for r in result_lists)} docs -> {len(results)} unique")
        
        return results
    
    def weighted_fusion(
        self,
        opensearch_results: List[Dict[str, Any]],
        qdrant_results: List[Dict[str, Any]],
        alpha: float = 0.7,
        id_field: str = "id",
        top_k: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Combine results using weighted score averaging.
        
        Formula: score(d) = α * text_score + (1-α) * semantic_score
        
        Args:
            opensearch_results: Results from OpenSearch (text search)
            qdrant_results: Results from Qdrant (semantic search)
            alpha: Weight for text search (0-1)
            id_field: Field name containing document ID
            top_k: Number of results to return
        
        Returns:
            Fused list sorted by weighted score
        """
        doc_scores: Dict[str, Dict[str, float]] = {}
        doc_data: Dict[str, Dict[str, Any]] = {}
        
        # Normalize OpenSearch scores (0-1)
        max_os_score = max((d.get("score", 0) for d in opensearch_results), default=1) or 1
        for doc in opensearch_results:
            doc_id = str(doc.get(id_field, ""))
            if not doc_id:
                continue
            doc_scores[doc_id] = {"text": doc.get("score", 0) / max_os_score, "semantic": 0}
            doc_data[doc_id] = dict(doc)
        
        # Add Qdrant scores (already 0-1 for cosine similarity)
        for doc in qdrant_results:
            doc_id = str(doc.get(id_field, ""))
            if not doc_id:
                continue
            if doc_id in doc_scores:
                doc_scores[doc_id]["semantic"] = doc.get("score", 0)
            else:
                doc_scores[doc_id] = {"text": 0, "semantic": doc.get("score", 0)}
                doc_data[doc_id] = dict(doc)
        
        # Calculate weighted scores
        weighted_scores: Dict[str, float] = {}
        for doc_id, scores in doc_scores.items():
            weighted_scores[doc_id] = alpha * scores["text"] + (1 - alpha) * scores["semantic"]
        
        # Sort by weighted score
        sorted_ids = sorted(weighted_scores.keys(), key=lambda x: weighted_scores[x], reverse=True)
        
        # Build result list
        results = []
        for doc_id in sorted_ids[:top_k]:
            doc = doc_data[doc_id]
            doc["weighted_score"] = weighted_scores[doc_id]
            doc["text_score"] = doc_scores[doc_id]["text"]
            doc["semantic_score"] = doc_scores[doc_id]["semantic"]
            doc["fusion_method"] = "weighted"
            results.append(doc)
        
        logger.info(f"Weighted fusion (α={alpha}): {len(results)} results")
        
        return results


def hybrid_search_with_rrf(
    opensearch_results: List[Dict[str, Any]],
    qdrant_results: List[Dict[str, Any]],
    k: int = 60,
    top_k: int = 10
) -> List[Dict[str, Any]]:
    """
    Convenience function for RRF fusion of OpenSearch + Qdrant results.
    
    Args:
        opensearch_results: Results from OpenSearch
        qdrant_results: Results from Qdrant
        k: RRF constant
        top_k: Number of results
    
    Returns:
        Fused results
    """
    fusion = SearchFusion(k=k)
    return fusion.reciprocal_rank_fusion(
        result_lists=[opensearch_results, qdrant_results],
        top_k=top_k
    )
