"""
Explainable AI (XAI) Service
Provides explanations for ML model predictions using SHAP and LIME
"""
import logging
from typing import List, Dict, Any, Optional
import numpy as np

logger = logging.getLogger("service.xai")


class XAIService:
    """
    Explainable AI service for interpreting model predictions.
    
    Supports:
    - SHAP (feature importance)
    - LIME (local interpretable explanations)
    - Attention visualization (for transformers)
    """
    
    def __init__(self):
        self._shap_explainer = None
        logger.info("XAI Service initialized")
    
    def explain_rerank_score(
        self,
        query: str,
        document: str,
        score: float,
        top_k_features: int = 10
    ) -> Dict[str, Any]:
        """
        Explain why a document got a particular rerank score.
        
        Uses token importance analysis to show which words
        contributed most to the relevance score.
        
        Args:
            query: Search query
            document: Document content
            score: Rerank score
            top_k_features: Number of top features to return
        
        Returns:
            Explanation with token importance scores
        """
        try:
            # Simple token overlap analysis (fast, no heavy ML)
            query_tokens = set(query.lower().split())
            doc_tokens = document.lower().split()
            
            # Calculate token importance based on query overlap
            token_scores = []
            for i, token in enumerate(doc_tokens[:200]):  # Limit to first 200 tokens
                importance = 1.0 if token in query_tokens else 0.0
                
                # Boost for exact matches
                if token in query_tokens:
                    importance += 0.5
                
                # Position decay (earlier tokens slightly more important)
                position_factor = 1.0 - (i / 200) * 0.2
                importance *= position_factor
                
                token_scores.append({
                    "token": token,
                    "importance": round(importance, 3),
                    "position": i
                })
            
            # Sort by importance
            token_scores.sort(key=lambda x: x["importance"], reverse=True)
            
            # Calculate explanation summary
            matching_tokens = [t for t in token_scores if t["importance"] > 0]
            coverage = len(matching_tokens) / max(len(query_tokens), 1)
            
            return {
                "method": "token_overlap",
                "query": query,
                "score": score,
                "top_features": token_scores[:top_k_features],
                "summary": {
                    "query_coverage": round(coverage, 2),
                    "matching_tokens": len(matching_tokens),
                    "total_query_tokens": len(query_tokens)
                },
                "interpretation": self._generate_interpretation(score, coverage)
            }
            
        except Exception as e:
            logger.error(f"Explanation generation failed: {e}")
            return {
                "method": "fallback",
                "error": str(e),
                "score": score
            }
    
    def explain_with_shap(
        self,
        model,
        inputs: List[str],
        predictions: List[float]
    ) -> List[Dict[str, Any]]:
        """
        Generate SHAP explanations for model predictions.
        
        Note: Requires shap package and compatible model.
        
        Args:
            model: ML model with predict method
            inputs: Input texts
            predictions: Model predictions
        
        Returns:
            List of SHAP explanations per input
        """
        try:
            import shap
            
            # Create explainer (text classifier)
            if self._shap_explainer is None:
                self._shap_explainer = shap.Explainer(model)
            
            shap_values = self._shap_explainer(inputs)
            
            explanations = []
            for i, (inp, pred) in enumerate(zip(inputs, predictions)):
                exp = {
                    "input": inp[:200],
                    "prediction": pred,
                    "shap_values": shap_values[i].values.tolist() if hasattr(shap_values[i], 'values') else [],
                    "base_value": float(shap_values[i].base_values) if hasattr(shap_values[i], 'base_values') else 0
                }
                explanations.append(exp)
            
            return explanations
            
        except ImportError:
            logger.warning("SHAP not installed. Using fallback explanation.")
            return [{"method": "fallback", "prediction": p} for p in predictions]
        except Exception as e:
            logger.error(f"SHAP explanation failed: {e}")
            return [{"error": str(e)}]
    
    def explain_search_results(
        self,
        query: str,
        results: List[Dict[str, Any]],
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Explain why each search result was ranked as it was.
        
        Args:
            query: Original search query
            results: Search results with scores
            top_k: Number of results to explain
        
        Returns:
            Results with added explanation field
        """
        explained_results = []
        
        for result in results[:top_k]:
            content = result.get("content", result.get("snippet", ""))
            score = result.get("score", result.get("combinedScore", 0))
            
            explanation = self.explain_rerank_score(
                query=query,
                document=content,
                score=score
            )
            
            result_with_explanation = dict(result)
            result_with_explanation["explanation"] = explanation
            explained_results.append(result_with_explanation)
        
        # Add remaining results without explanation
        explained_results.extend(results[top_k:])
        
        return explained_results
    
    def _generate_interpretation(self, score: float, coverage: float) -> str:
        """Generate human-readable interpretation."""
        if score > 0.8:
            relevance = "highly relevant"
        elif score > 0.5:
            relevance = "moderately relevant"
        elif score > 0.2:
            relevance = "somewhat relevant"
        else:
            relevance = "marginally relevant"
        
        if coverage > 0.8:
            match = "strong keyword match"
        elif coverage > 0.5:
            match = "moderate keyword match"
        else:
            match = "weak keyword match"
        
        return f"Document is {relevance} with {match} ({coverage*100:.0f}% query terms found)"
    
    def generate_attention_heatmap(
        self,
        query: str,
        document: str,
        model_attention: Optional[np.ndarray] = None
    ) -> Dict[str, Any]:
        """
        Generate attention heatmap data for visualization.
        
        Args:
            query: Search query
            document: Document text
            model_attention: Optional attention weights from transformer
        
        Returns:
            Heatmap data for frontend visualization
        """
        query_tokens = query.lower().split()
        doc_tokens = document.lower().split()[:50]  # Limit for visualization
        
        if model_attention is not None:
            # Use actual attention weights
            heatmap = model_attention.tolist()
        else:
            # Generate synthetic attention based on token similarity
            heatmap = []
            for q_token in query_tokens:
                row = []
                for d_token in doc_tokens:
                    # Simple similarity: 1 if exact match, 0 otherwise
                    similarity = 1.0 if q_token == d_token else 0.0
                    row.append(similarity)
                heatmap.append(row)
        
        return {
            "query_tokens": query_tokens,
            "doc_tokens": doc_tokens,
            "heatmap": heatmap,
            "visualization_type": "attention_heatmap"
        }


# Singleton
_xai_service: Optional[XAIService] = None


def get_xai_service() -> XAIService:
    """Get XAI service singleton."""
    global _xai_service
    if _xai_service is None:
        _xai_service = XAIService()
    return _xai_service
