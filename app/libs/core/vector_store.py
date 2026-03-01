"""🧠 VECTOR STORE (Qdrant Integration).
=====================================
Core component for semantic search and memory retrieval.
Part of PREDATOR V45 Organism Architecture.
"""

from dataclasses import dataclass
import logging
import os
import random
from typing import Any
import uuid


# Try importing Qdrant client
try:
    from qdrant_client import QdrantClient
    from qdrant_client.http import models

    QDRANT_AVAILABLE = True
except ImportError:
    QDRANT_AVAILABLE = False

logger = logging.getLogger("core.vector_store")


@dataclass
class VectorRecord:
    id: str
    vector: list[float]
    payload: dict[str, Any]


class VectorStore:
    def __init__(self, collection_name: str = "predator_memory"):
        self.collection_name = collection_name
        self.host = os.getenv("QDRANT_HOST", "qdrant")  # Docker service name
        self.port = int(os.getenv("QDRANT_PORT", 6333))
        self.client = None
        self.dim = 384  # Default for all-MiniLM-L6-v2

        if QDRANT_AVAILABLE:
            try:
                self.client = QdrantClient(host=self.host, port=self.port, timeout=10)
                logger.info(f"✅ Qdrant client initialized: {self.host}:{self.port}")
            except Exception as e:
                logger.exception(f"❌ Qdrant connection failed: {e}")
        else:
            logger.warning("⚠️ Qdrant client library not installed. Vector store in mock mode.")

    def ensure_collection(self):
        """Create collection if not exists."""
        if not self.client:
            return

        try:
            collections = self.client.get_collections().collections
            exists = any(c.name == self.collection_name for c in collections)

            if not exists:
                logger.info(f"Creating Qdrant collection: {self.collection_name}")
                self.client.create_collection(
                    self.collection_name,
                    vectors_config=models.VectorParams(
                        size=self.dim, distance=models.Distance.COSINE
                    ),
                )
        except Exception as e:
            logger.exception(f"Failed to ensure collection: {e}")

    async def add_texts(self, texts: list[str], payloads: list[dict[str, Any]]):
        """Vectorize and store texts."""
        if not texts:
            return

        vectors = []
        for _text in texts:
            # TODO: Integrate with real Embedding Model
            # For now, generate random unit vectors to demonstrate flow
            vec = [random.uniform(-1, 1) for _ in range(self.dim)]
            norm = sum(x * x for x in vec) ** 0.5
            vectors.append([x / norm for x in vec])

        points = []
        for i, vec in enumerate(vectors):
            points.append(
                models.PointStruct(
                    id=str(uuid.uuid4()), vector=vec, payload={"text": texts[i], **payloads[i]}
                )
            )

        if self.client:
            try:
                self.client.upsert(self.collection_name, points=points)
                logger.info(f"💾 Stored {len(points)} vectors in Qdrant")
            except Exception as e:
                logger.exception(f"Failed to upsert vectors: {e}")
        else:
            logger.info(f"💾 [MOCK] Stored {len(points)} vectors (Qdrant unavailable)")

    async def search(self, query: str, limit: int = 5) -> list[dict[str, Any]]:
        """Search similar texts."""
        if not self.client:
            return []

        # Mock query vector
        vec = [random.uniform(-1, 1) for _ in range(self.dim)]

        try:
            results = self.client.search(self.collection_name, query_vector=vec, limit=limit)
            return [
                {"score": r.score, "text": r.payload.get("text"), "metadata": r.payload}
                for r in results
            ]
        except Exception as e:
            logger.exception(f"Search failed: {e}")
            return []


# Singleton
vector_store = VectorStore()
