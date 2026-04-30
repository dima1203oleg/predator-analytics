from __future__ import annotations

import os

import numpy as np

from app.libs.core.structured_logger import get_logger

logger = get_logger("service.embedding")


class EmbeddingService:
    """Service for generating text embeddings for semantic search.
    Uses sentence-transformers for vector generation.
    **CONSTITUTIONAL COMPLIANCE (v45.0)**:
    - Enforced by Arbiter via OperationalPolicy.
    - Verified by Truth Ledger & Reality-Bound Axioms.
    - Audited by Constitutional Linter.
    """

    def __init__(self, model_name: str = "nomic-embed-text"):
        """Initialize embedding service.

        Args:
            model_name: Ollama model name (default: nomic-embed-text)

        """
        from app.libs.core.config import settings

        self.model_name = os.environ.get("EMBEDDING_MODEL", model_name)
        self.ollama_url = f"{settings.LLM_OLLAMA_BASE_URL}/embeddings"
        self.vector_size = 768  # default for nomic-embed-text

        logger.info("embedding_service_initialized", model=self.model_name, url=self.ollama_url)

    def _load_model(self):
        """No-op for API-based embedding."""

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

    async def generate_embedding_async(self, text: str) -> list[float]:
        """Generate embedding vector asynchronously via Ollama."""
        import httpx

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.ollama_url, json={"model": self.model_name, "prompt": text}, timeout=30.0
                )
                response.raise_for_status()
                data = response.json()
                return data.get("embedding", [0.0] * self.vector_size)
        except Exception as e:
            logger.exception("ollama_embedding_async_failed", error=str(e))
            return [0.0] * self.vector_size

    def generate_embedding(self, text: str) -> list[float]:
        """Generate embedding vector via Ollama (Blocking)."""
        import requests

        try:
            response = requests.post(
                self.ollama_url, json={"model": self.model_name, "prompt": text}, timeout=30.0
            )
            response.raise_for_status()
            data = response.json()
            return data.get("embedding", [0.0] * self.vector_size)
        except Exception as e:
            logger.exception("ollama_embedding_failed", error=str(e))
            return [0.0] * self.vector_size

    def generate_batch_embeddings(self, texts: list[str]) -> list[list[float]]:
        """Generate embeddings for multiple texts via Ollama."""
        results = []
        for text in texts:
            results.append(self.generate_embedding(text))
        return results

    def cosine_similarity(self, vec1: list[float], vec2: list[float]) -> float:
        """Calculate cosine similarity between two vectors.

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

    def rerank(self, query: str, documents: list[str]) -> list[float]:
        """Rerank a list of documents based on relevance to the query using a Cross-Encoder.

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
            logger.exception("reranking_failed", error=str(e), docs_count=len(documents))
            # Fallback: return 0.0 scores
            return [0.0] * len(documents)

    # =====================
    # MULTIMODAL (CLIP)
    # =====================

    def _load_clip_model(self):
        """Lazy load CLIP model."""
        if not hasattr(self, "clip_model") or self.clip_model is None:
            try:
                from sentence_transformers import SentenceTransformer

                self.clip_model = SentenceTransformer("clip-ViT-B-32")
                logger.info("clip_model_loaded", model="clip-ViT-B-32")
            except Exception as e:
                logger.exception(f"Failed to load CLIP model: {e}")
                raise

    def generate_clip_embedding(
        self, text: str | None = None, image_path: str | None = None
    ) -> list[float]:
        """Generate multimodal embedding using CLIP.
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
            logger.exception(f"CLIP embedding failed: {e}")
            return [0.0] * 512


# Singleton
_embedding_service = EmbeddingService()


def get_embedding_service() -> EmbeddingService:
    return _embedding_service
