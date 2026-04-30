"""Entity Resolution Engine (ERE) — PREDATOR Analytics v61.0-ELITE.

Забезпечує дедуплікацію та пошук схожих сутностей (компаній, осіб) за допомогою векторних ембедінгів Qdrant.
TZ v5.0 §10.1 (ERE).
"""
import logging
from typing import Any
from uuid import UUID

import httpx

from app.config import get_settings
from app.services.ai_service import AIService

logger = logging.getLogger(__name__)
settings = get_settings()

class EREService:
    """Сервіс для розв'язання сутностей та векторного пошуку."""

    def __init__(self):
        self.qdrant_url = settings.QDRANT_URL
        self.collection_name = "entities"

    async def ensure_collection(self):
        """Перевіряє наявність колекції в Qdrant."""
        try:
            async with httpx.AsyncClient() as client:
                # Перевіряємо статус колекції
                response = await client.get(f"{self.qdrant_url}/collections/{self.collection_name}")
                if response.status_code == 200:
                    return

                # Створюємо колекцію, якщо вона відсутня
                # Розмірність вектора 1536 (Ollama mxbai-embed-large або подібні)
                # Якщо використовується multilingual-e5-small — це 384.
                # Для універсальності використовуємо 1536.
                vector_size = 1536
                await client.put(
                    f"{self.qdrant_url}/collections/{self.collection_name}",
                    json={
                        "vectors": {
                            "size": vector_size,
                            "distance": "Cosine"
                        }
                    }
                )
                logger.info(f"Колекція Qdrant '{self.collection_name}' створена.")
        except Exception as e:
            logger.error(f"Qdrant Connection Error: {e}")

    async def index_entity(self, tenant_id: UUID | str, entity_id: str, text_content: str, metadata: dict[str, Any]):
        """Індексація сутності для векторного пошуку."""
        embedding = await AIService.get_embeddings(text_content)

        payload = {
            "tenant_id": str(tenant_id),
            "entity_id": entity_id,
            **metadata
        }

        try:
            async with httpx.AsyncClient() as client:
                await client.put(
                    f"{self.qdrant_url}/collections/{self.collection_name}/points",
                    json={
                        "points": [
                            {
                                "id": hash(entity_id) % (2**63 - 1), # Спрощений ID для Qdrant
                                "vector": embedding,
                                "payload": payload
                            }
                        ]
                    }
                )
        except Exception as e:
            logger.error(f"Помилка індексації в Qdrant: {e}")

    async def find_duplicates(self, tenant_id: UUID | str, text_content: str, threshold: float = 0.85, limit: int = 5) -> list[dict[str, Any]]:
        """Пошук потенційних дублікатів за векторною схожістю."""
        embedding = await AIService.get_embeddings(text_content)

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.qdrant_url}/collections/{self.collection_name}/points/search",
                    json={
                        "vector": embedding,
                        "filter": {
                            "must": [
                                {"key": "tenant_id", "match": {"value": str(tenant_id)}}
                            ]
                        },
                        "limit": limit,
                        "with_payload": True,
                        "score_threshold": threshold
                    }
                )
                if response.status_code == 200:
                    results = response.json().get("result", [])
                    return [
                        {
                            "entity_id": r["payload"].get("entity_id"),
                            "score": r["score"],
                            "metadata": r["payload"]
                        }
                        for r in results
                    ]
        except Exception as e:
            logger.error(f"Помилка пошуку в Qdrant: {e}")

        return []
