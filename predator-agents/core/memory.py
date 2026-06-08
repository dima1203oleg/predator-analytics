"""Predator Agents OS — Agent Memory
Система довгострокової пам'яті на базі Qdrant.
"""

import os
from typing import Any
import uuid

from qdrant_client import QdrantClient
from qdrant_client.http import models

from core.llm import LLMManager


class AgentMemory:
    def __init__(self, collection_name: str = "agent_memories"):
        self.url = os.getenv("QDRANT_URL", "http://194.177.1.240:6333")
        self.client = QdrantClient(url=self.url)
        self.collection_name = collection_name
        # Використовуємо qwen3 для embeddings (або окрему модель)
        self.embeddings = LLMManager(model_name="qwen3:8b").get_embeddings()
        self._ensure_collection()

    def _ensure_collection(self):
        """Перевіряє наявність колекції, створює її за потреби.
        """
        try:
            collections = self.client.get_collections().collections
            exists = any(c.name == self.collection_name for c in collections)
            if not exists:
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=models.VectorParams(size=4096, distance=models.Distance.COSINE), # Qwen3 size
                )
        except Exception as e:
            print(f"Помилка ініціалізації Qdrant: {e}")

    async def add_memory(self, text: str, metadata: dict[str, Any] = None):
        """Додає новий факт у пам'ять.
        """
        vector = self.embeddings.embed_query(text)

        self.client.upsert(
            collection_name=self.collection_name,
            points=[
                models.PointStruct(
                    id=str(uuid.uuid4()),
                    vector=vector,
                    payload={"text": text, **(metadata or {})}
                )
            ]
        )

    async def query_memories(self, query_text: str, limit: int = 5) -> list[dict[str, Any]]:
        """Шукає схожі факти в пам'яті.
        """
        vector = self.embeddings.embed_query(query_text)

        results = self.client.search(
            collection_name=self.collection_name,
            query_vector=vector,
            limit=limit
        )

        return [hit.payload for hit in results]
