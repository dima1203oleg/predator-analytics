import os
import logging
from typing import List, Dict, Any
import numpy as np

logger = logging.getLogger("service.embedding")

class EmbeddingService:
    """
    Service for generating text embeddings for semantic search.
    Uses sentence-transformers for vector generation.
    """
    
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        """
        Initialize embedding service.
        
        Args:
            model_name: HuggingFace model name (default: all-MiniLM-L6-v2, 384 dimensions)
        """
        self.model_name = model_name
        self.vector_size = 384  # for all-MiniLM-L6-v2
        self.model = None
        self.reranker = None
        self.reranker_model_name = "cross-encoder/ms-marco-MiniLM-L-6-v2"
        
        # Lazy loading - only load when first needed
        logger.info(f"Embedding service initialized with model: {model_name}")
    
    def _load_model(self):
        """Lazy load the model."""
        if self.model is None:
            try:
                from sentence_transformers import SentenceTransformer
                from sentence_transformers import SentenceTransformer, CrossEncoder
                self.model = SentenceTransformer(self.model_name)
                logger.info(f"Loaded embedding model: {self.model_name}")
                
                # Load reranker
                self.reranker = CrossEncoder(self.reranker_model_name)
                logger.info(f"Loaded reranker model: {self.reranker_model_name}")
            except ImportError:
                logger.error("sentence-transformers not installed. Install with: pip install sentence-transformers")
                raise
            except Exception as e:
                logger.error(f"Failed to load model: {e}")
                raise
    
    async def generate_embedding_async(self, text: str) -> List[float]:
        """
        Generate embedding vector asynchronously (non-blocking).
        """
        import asyncio
        from functools import partial
        
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self.generate_embedding, text)

    def generate_embedding(self, text: str) -> List[float]:
        """
        Generate embedding vector for text.
        Blocking call - verify safe usage or use generate_embedding_async.
        
        Args:
            text: Input text
        
        Returns:
            List of floats (vector representation)
        """
        self._load_model()
        
        try:
            embedding = self.model.encode(text, convert_to_numpy=True)
            return embedding.tolist()
        except Exception as e:
            logger.error(f"Embedding generation failed: {e}")
            # Return zero vector as fallback
            return [0.0] * self.vector_size
    
    def generate_batch_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for multiple texts (batch processing).
        
        Args:
            texts: List of input texts
        
        Returns:
            List of embedding vectors
        """
        self._load_model()
        
        try:
            embeddings = self.model.encode(texts, convert_to_numpy=True, show_progress_bar=True)
            return embeddings.tolist()
        except Exception as e:
            logger.error(f"Batch embedding generation failed: {e}")
            return [[0.0] * self.vector_size] * len(texts)
    
    def cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """
        Calculate cosine similarity between two vectors.
        
        Args:
            vec1: First vector
            vec2: Second vector
        
        Returns:
            Similarity score (0-1)
        """
        v1 = np.array(vec1)
        v2 = np.array(vec2)
        
        dot_product = np.dot(v1, v2)
        norm_v1 = np.linalg.norm(v1)
        norm_v2 = np.linalg.norm(v2)
        
        if norm_v1 == 0 or norm_v2 == 0:
            return 0.0
        
        return float(dot_product / (norm_v1 * norm_v2))

    def rerank(self, query: str, documents: List[str]) -> List[float]:
        """
        Rerank a list of documents based on relevance to the query using a Cross-Encoder.
        
        Args:
            query: The search query
            documents: List of document texts to score
            
        Returns:
            List of scores (higher is better)
        """
        self._load_model()
        
        if not documents:
            return []
            
        try:
            # Prepare pairs for cross-encoder
            pairs = [[query, doc] for doc in documents]
            
            # Predict scores
            scores = self.reranker.predict(pairs)
            return scores.tolist()
        except Exception as e:
            logger.error(f"Reranking failed: {e}")
            # Fallback: return 0.0 scores
            return [0.0] * len(documents)
