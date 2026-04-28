"""Qdrant Sink — PREDATOR Analytics v61.0-ELITE Ironclad.

Векторне сховище для семантичного пошуку.
"""
import os
from typing import Any

from predator_common.logging import get_logger

logger = get_logger("ingestion_worker.qdrant")


class QdrantSink:
    """Сінк для збереження векторів у Qdrant."""

    COLLECTION_NAME = "predator-embeddings"
    VECTOR_SIZE = 384  # sentence-transformers/all-MiniLM-L6-v2

    def __init__(self) -> None:
        """Ініціалізація Qdrant клієнта."""
        self.url = os.getenv("QDRANT_URL", "http://localhost:6333")
        self.api_key = os.getenv("QDRANT_API_KEY", None)

        self._client = None
        self._model = None
        self._initialized = False

    def _get_embedding_model(self) -> Any:
        """Завантажує модель для генерації ембедингів."""
        if self._model is None:
            try:
                from sentence_transformers import SentenceTransformer

                # Використовуємо легку модель
                model_name = os.getenv(
                    "EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2"
                )
                device = os.getenv("EMBEDDING_DEVICE", "cpu")

                logger.info(f"Loading embedding model: {model_name} on {device}")
                self._model = SentenceTransformer(model_name, device=device)
            except ImportError:
                logger.warning(
                    "sentence-transformers not installed, embeddings disabled"
                )
                return None
            except Exception as e:
                logger.error(f"Failed to load embedding model: {e}")
                return None

        return self._model

    def _get_client(self) -> Any:
        """Отримує Qdrant клієнт."""
        if self._client is None:
            try:
                from qdrant_client import QdrantClient

                self._client = QdrantClient(
                    url=self.url,
                    api_key=self.api_key,
                )
                logger.info(f"Connected to Qdrant: {self.url}")
            except ImportError:
                logger.warning("qdrant-client not installed")
                return None
            except Exception as e:
                logger.error(f"Failed to connect to Qdrant: {e}")
                return None

        return self._client

    async def _ensure_collection(self, tenant_id: str) -> bool:
        """Створює колекцію якщо не існує."""
        if self._initialized:
            return True

        client = self._get_client()
        if not client:
            return False

        collection_name = f"{self.COLLECTION_NAME}-{tenant_id}"

        try:
            from qdrant_client.models import Distance, VectorParams

            collections = client.get_collections().collections
            exists = any(c.name == collection_name for c in collections)

            if not exists:
                client.create_collection(
                    collection_name=collection_name,
                    vectors_config=VectorParams(
                        size=self.VECTOR_SIZE,
                        distance=Distance.COSINE,
                    ),
                )
                logger.info(f"Created Qdrant collection: {collection_name}")

            self._initialized = True
            return True
        except Exception as e:
            logger.error(f"Failed to ensure collection: {e}")
            return False

    def generate_embeddings(self, texts: list[str]) -> list[list[float]] | None:
        """Генерує ембединги для списку текстів."""
        model = self._get_embedding_model()
        if not model:
            return None

        try:
            embeddings = model.encode(texts, convert_to_numpy=True)
            return embeddings.tolist()
        except Exception as e:
            logger.error(f"Failed to generate embeddings: {e}")
            return None

    async def upsert_vectors(
        self, documents: list[dict[str, Any]], tenant_id: str
    ) -> None:
        """Зберігає вектори документів у Qdrant."""
        if not documents:
            return

        if not await self._ensure_collection(tenant_id):
            return

        client = self._get_client()
        model = self._get_embedding_model()

        if not client or not model:
            logger.warning("Qdrant or embedding model not available, skipping")
            return

        collection_name = f"{self.COLLECTION_NAME}-{tenant_id}"

        # Готуємо тексти для ембедингів
        texts = []
        valid_docs = []

        for doc in documents:
            # Комбінуємо текстові поля
            text_parts = []
            if doc.get("product_description"):
                text_parts.append(str(doc["product_description"]))
            if doc.get("country_origin"):
                text_parts.append(str(doc["country_origin"]))

            if text_parts:
                texts.append(" ".join(text_parts))
                valid_docs.append(doc)

        if not texts:
            return

        # Генеруємо ембединги
        embeddings = self.generate_embeddings(texts)
        if not embeddings:
            return

        try:
            from qdrant_client.models import PointStruct

            points = []
            for i, (doc, embedding) in enumerate(zip(valid_docs, embeddings, strict=False)):
                point_id = hash(doc.get("_record_hash", str(i))) & 0x7FFFFFFFFFFFFFFF

                payload = {
                    "declaration_number": doc.get("declaration_number"),
                    "company_edrpou": doc.get("company_edrpou"),
                    "ueid": doc.get("ueid"),
                    "product_description": doc.get("product_description"),
                    "country_origin": doc.get("country_origin"),
                    "uktzed_code": doc.get("uktzed_code"),
                    "tenant_id": tenant_id,
                    "job_id": doc.get("_job_id"),
                }

                points.append(
                    PointStruct(
                        id=point_id,
                        vector=embedding,
                        payload={k: v for k, v in payload.items() if v is not None},
                    )
                )

            # Batch upsert
            client.upsert(collection_name=collection_name, points=points)
            logger.debug(f"Upserted {len(points)} vectors to Qdrant")

        except Exception as e:
            logger.error(f"Failed to upsert vectors: {e}")

    async def close(self) -> None:
        """Закриття клієнта."""
        if self._client:
            self._client.close()
            self._client = None
