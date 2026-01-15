import logging
import os
from typing import List
import numpy as np
from libs.core.governance import OperationalPolicy
from libs.core.reality import get_juridical_transpiler
from predatorctl.core.ledger_client import LedgerClient

from libs.core.structured_logger import get_logger, log_performance

logger = get_logger("service.embedding")
ledger = LedgerClient()

class EmbeddingService:
    """
    Service for generating text embeddings for semantic search.
    Uses sentence-transformers for vector generation.
    **CONSTITUTIONAL COMPLIANCE (v27.0)**:
    - Enforced by Arbiter via OperationalPolicy.
    - Verified by Truth Ledger & Reality-Bound Axioms.
    - Audited by Constitutional Linter.
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

        # Deprecated Tier Check (Now Handled by Arbiter)
        self.compute_tier = os.environ.get("COMPUTE_TIER", "basic").lower()
        self.is_gpu_tier = self.compute_tier in ["gpu", "heavy", "ml"]

        # Lazy loading - only load when first needed
        logger.info("embedding_service_initialized", model=model_name)

        # Batching service
        self._batch_service = None

    def _load_model(self):
        """Lazy load the model. Enforces Constitutional Control via Arbiter."""
        if self.model is None:
            # 1. Constitutional Gatekeeping (v26)
            decision = OperationalPolicy.authorize_high_compute(
                component="EmbeddingService",
                task_details={
                    "model_name": self.model_name,
                    "reranker": self.reranker_model_name,
                    "action": "load_heavy_models"
                }
            )

            if not decision.get("allowed"):
                logger.warning(
                    "constitutional_model_load_denied",
                    reason=decision.get("reason"),
                    component="EmbeddingService"
                )
                self._load_dummy_model()
                return

            logger.info(
                "constitutional_model_load_approved",
                signature=decision.get("signature", "N/A")[:8]
            )

            # 2. Load Real Model (Arbiter approved context)
            try:
                from sentence_transformers import SentenceTransformer
                from sentence_transformers import CrossEncoder
                with log_performance(logger, "model_loading_latency", model=self.model_name):
                    self.model = SentenceTransformer(self.model_name)
                logger.info("embedding_model_loaded", model=self.model_name)

                # Load reranker
                self.reranker = CrossEncoder(self.reranker_model_name)
                logger.info("reranker_model_loaded", model=self.reranker_model_name)
            except ImportError:
                logger.warning("sentence_transformers_missing_fallback_dummy")
                self._load_dummy_model()
            except Exception as e:
                logger.error("model_load_failed", error=str(e), model=self.model_name)
                raise

    def _load_dummy_model(self):
        """Load compliant dummy model for local/basic tiers."""
        class DummyModel:
            def encode(self, text, convert_to_numpy=True, show_progress_bar=False):
                # Return 384-dim vector with small noise (matches all-MiniLM-L6-v2)
                # Prevents Divide-by-Zero in cosine similarity (Axiom 16 Resilience)
                if isinstance(text, list):
                    return np.random.rand(len(text), 384) * 0.01
                return np.random.rand(384) * 0.01

        self.model = DummyModel()
        self.reranker = None  # No reranking locally

    async def generate_embedding_async(self, text: str) -> List[float]:
        """
        Generate embedding vector asynchronously with dynamic batching.
        """
        if self._batch_service is None:
            from app.services.batch_embedder import BatchEmbeddingService
            self._batch_service = BatchEmbeddingService(self)
            self._batch_service.start()

        return await self._batch_service.embed_async(text)

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
            logger.error("batch_embedding_failed", error=str(e), count=len(texts))
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
            logger.error("reranking_failed", error=str(e), docs_count=len(documents))
            # Fallback: return 0.0 scores
            return [0.0] * len(documents)

    # =====================
    # MULTIMODAL (CLIP)
    # =====================

    def _load_clip_model(self):
        """Lazy load CLIP model."""
        if not hasattr(self, 'clip_model') or self.clip_model is None:
            try:
                from sentence_transformers import SentenceTransformer
                self.clip_model = SentenceTransformer('clip-ViT-B-32')
                logger.info("clip_model_loaded", model="clip-ViT-B-32")
            except Exception as e:
                logger.error(f"Failed to load CLIP model: {e}")
                raise

    def generate_clip_embedding(self, text: str = None, image_path: str = None) -> List[float]:
        """
        Generate multimodal embedding using CLIP.
        Supports text OR image input.
        """
        self._load_clip_model()

        try:
            if text:
                return self.clip_model.encode(text).tolist()

            if image_path:
                from PIL import Image
                image = Image.open(image_path)
                return self.clip_model.encode(image).tolist()

            return [0.0] * 512

        except Exception as e:
            logger.error(f"CLIP embedding failed: {e}")
            return [0.0] * 512


# Singleton
_embedding_service = EmbeddingService()

def get_embedding_service() -> EmbeddingService:
    return _embedding_service
