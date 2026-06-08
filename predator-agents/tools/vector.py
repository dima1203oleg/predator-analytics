"""Predator Agents OS — Vector Tools
Інструменти для семантичного пошуку в Qdrant.
"""

import os

from qdrant_client import QdrantClient


class VectorTools:
    def __init__(self):
        self.url = os.getenv("QDRANT_URL", "http://194.177.1.240:6333")
        self.client = QdrantClient(url=self.url)

    def search_similar_documents(self, collection: str, query_vector: list[float], limit: int = 5):
        """Пошук схожих документів у вказаній колекції.
        """
        return self.client.search(
            collection_name=collection,
            query_vector=query_vector,
            limit=limit
        )

    def search_by_text(self, collection: str, text: str, limit: int = 5):
        """Повнотекстовий або гібридний пошук (якщо налаштовано).
        Для повноцінної роботи потрібні embeddings.
        """
        # Тут буде інтеграція з Ollama для отримання embeddings
        pass
