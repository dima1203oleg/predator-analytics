"""
Cross-Encoder Reranker Service
Implements MS MARCO MiniLM-based reranking for search results
"""
from typing import List, Dict, Tuple
from sentence_transformers import CrossEncoder
import logging

logger = logging.getLogger(__name__)


class RerankerService:
    """
    Semantic reranking using Cross-Encoder model.
    Usage: re-score top-N search results based on query-document relevance.
    """
    
    def __init__(self, model_name: str = "cross-encoder/ms-marco-MiniLM-L-12-v2"):
        """
        Initialize reranker with pre-trained model.
        
        Args:
            model_name: HuggingFace model identifier
        """
        logger.info(f"Loading reranker model: {model_name}")
        self.model = CrossEncoder(model_name, max_length=512)
        logger.info("Reranker model loaded successfully")
    
    def rerank(
        self, 
        query: str, 
        documents: List[Dict],
        top_k: int = 10,
        score_field: str = "title"
    ) -> List[Tuple[Dict, float]]:
        """
        Rerank documents based on semantic relevance to query.
        
        Args:
            query: Search query text
            documents: List of documents (dicts with 'id', 'title', 'content')
            top_k: Number of top results to return
            score_field: Field to use for scoring ('title', 'content', or 'both')
        
        Returns:
            List of (document, relevance_score) tuples, sorted by score
        """
        if not documents:
            return []
        
        # Prepare query-document pairs
        pairs = []
        for doc in documents:
            if score_field == "both":
                text = f"{doc.get('title', '')} {doc.get('content', '')[:500]}"
            else:
                text = doc.get(score_field, "")
            pairs.append([query, text])
        
        # Compute relevance scores
        scores = self.model.predict(pairs)
        
        # Combine documents with scores
        ranked = list(zip(documents, scores))
        ranked.sort(key=lambda x: x[1], reverse=True)
        
        logger.info(f"Reranked {len(documents)} docs, top score: {ranked[0][1]:.3f}")
        
        return ranked[:top_k]


# Singleton instance
_reranker_instance = None

def get_reranker() -> RerankerService:
    """Dependency injection for FastAPI"""
    global _reranker_instance
    if _reranker_instance is None:
        _reranker_instance = RerankerService()
    return _reranker_instance
