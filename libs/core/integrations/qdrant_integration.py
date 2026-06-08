"""Інтеграція з Qdrant для векторного пошуку.

Модуль для створення векторів для RAG та семантичного пошуку.
"""

from __future__ import annotations

from dataclasses import dataclass
import logging
import os
from typing import Any

from qdrant_client import QdrantClient
from qdrant_client.models import Distance, PointStruct, VectorParams

logger = logging.getLogger(__name__)


@dataclass
class QdrantConfig:
    """Конфігурація Qdrant."""

    url: str = "http://localhost:6333"
    api_key: str | None = None
    collection_name: str = "declarations"
    vector_size: int = 768


class QdrantIntegration:
    """Інтеграція з Qdrant."""

    def __init__(self, config: QdrantConfig):
        self.config = config
        self.client = QdrantClient(
            url=config.url,
            api_key=config.api_key,
        )

    def create_collection(self):
        """Створити колекцію в Qdrant."""
        try:
            self.client.create_collection(
                collection_name=self.config.collection_name,
                vectors_config=VectorParams(
                    size=self.config.vector_size,
                    distance=Distance.COSINE
                )
            )
            logger.info(f"Колекція {self.config.collection_name} створена в Qdrant")
        except Exception as e:
            # Колекція може вже існувати
            logger.warning(f"Колекція може вже існувати: {e}")

    def generate_embedding(self, text: str) -> list[float]:
        """Згенерувати вектор для тексту.
        
        Args:
            text: Текст для векторизації
            
        Returns:
            Вектор

        """
        # TODO: Інтегрувати з реальним embedding сервісом (наприклад, OpenAI, SentenceTransformers)
        # Тимчасова заглушка - випадковий вектор
        import random
        return [random.random() for _ in range(self.config.vector_size)]

    def upsert_declaration(self, declaration_id: str, declaration_data: dict[str, Any]) -> int:
        """Вставити декларацію в Qdrant.
        
        Args:
            declaration_id: ID декларації
            declaration_data: Дані декларації
            
        Returns:
            Кількість вставлених векторів

        """
        try:
            # Генерація вектора з опису товару
            text = declaration_data.get('goods_description', '')
            if not text:
                text = f"{declaration_data.get('uktzed_code', '')} {declaration_data.get('origin_country', '')}"

            vector = self.generate_embedding(text)

            # Підготовка payload
            payload = {
                "id": declaration_id,
                "declaration_number": declaration_data.get('declaration_number'),
                "declaration_date": str(declaration_data.get('declaration_date')),
                "uktzed_code": declaration_data.get('uktzed_code'),
                "goods_description": declaration_data.get('goods_description'),
                "value_usd": declaration_data.get('value_usd'),
                "origin_country": declaration_data.get('origin_country'),
                "importer_ueid": declaration_data.get('importer_ueid'),
            }

            # Вставка
            self.client.upsert(
                collection_name=self.config.collection_name,
                points=[
                    PointStruct(
                        id=declaration_id,
                        vector=vector,
                        payload=payload
                    )
                ]
            )

            logger.debug(f"Вектор вставлено в Qdrant: {declaration_id}")
            return 1

        except Exception as e:
            logger.error(f"Помилка вставки в Qdrant: {e}")
            return 0

    def upsert_declarations_batch(self, declarations: list[tuple[str, dict[str, Any]]]) -> int:
        """Пакетна вставка декларацій в Qdrant.
        
        Args:
            declarations: Список кортеж (declaration_id, declaration_data)
            
        Returns:
            Кількість вставлених векторів

        """
        if not declarations:
            return 0

        points = []

        for declaration_id, declaration_data in declarations:
            # Генерація вектора
            text = declaration_data.get('goods_description', '')
            if not text:
                text = f"{declaration_data.get('uktzed_code', '')} {declaration_data.get('origin_country', '')}"

            vector = self.generate_embedding(text)

            # Підготовка payload
            payload = {
                "id": declaration_id,
                "declaration_number": declaration_data.get('declaration_number'),
                "declaration_date": str(declaration_data.get('declaration_date')),
                "uktzed_code": declaration_data.get('uktzed_code'),
                "goods_description": declaration_data.get('goods_description'),
                "value_usd": declaration_data.get('value_usd'),
                "origin_country": declaration_data.get('origin_country'),
                "importer_ueid": declaration_data.get('importer_ueid'),
            }

            points.append(
                PointStruct(
                    id=declaration_id,
                    vector=vector,
                    payload=payload
                )
            )

        try:
            self.client.upsert(
                collection_name=self.config.collection_name,
                points=points
            )

            logger.info(f"Вставлено {len(points)} векторів в Qdrant")
            return len(points)

        except Exception as e:
            logger.error(f"Помилка пакетної вставки в Qdrant: {e}")
            return 0

    def search_similar(self, query_text: str, limit: int = 10) -> list[dict[str, Any]]:
        """Пошук схожих декларацій.
        
        Args:
            query_text: Текст для пошуку
            limit: Ліміт результатів
            
        Returns:
            Список схожих декларацій

        """
        try:
            # Генерація вектора запиту
            query_vector = self.generate_embedding(query_text)

            # Пошук
            search_result = self.client.search(
                collection_name=self.config.collection_name,
                query_vector=query_vector,
                limit=limit
            )

            results = []
            for hit in search_result:
                results.append({
                    "id": hit.id,
                    "score": hit.score,
                    "payload": hit.payload
                })

            return results

        except Exception as e:
            logger.error(f"Помилка пошуку в Qdrant: {e}")
            return []

    def delete_declaration(self, declaration_id: str) -> bool:
        """Видалити декларацію з Qdrant.
        
        Args:
            declaration_id: ID декларації
            
        Returns:
            True якщо успішно

        """
        try:
            self.client.delete(
                collection_name=self.config.collection_name,
                points_selector=[declaration_id]
            )

            logger.debug(f"Вектор видалено з Qdrant: {declaration_id}")
            return True

        except Exception as e:
            logger.error(f"Помилка видалення з Qdrant: {e}")
            return False

    def close(self):
        """Закрити з'єднання з Qdrant."""
        self.client.close()
        logger.info("З'єднання з Qdrant закрито")


def get_qdrant_integration(config: QdrantConfig | None = None) -> QdrantIntegration:
    """Отримати інстанс інтеграції з Qdrant."""
    if config is None:
        config = QdrantConfig(
            url=os.getenv("QDRANT_URL", "http://localhost:6333"),
            api_key=os.getenv("QDRANT_API_KEY"),
            collection_name=os.getenv("QDRANT_COLLECTION", "declarations"),
            vector_size=int(os.getenv("QDRANT_VECTOR_SIZE", "768")),
        )
    return QdrantIntegration(config)
