"""
Qdrant Client для PREDATOR Analytics v56.5-ELITE
Асинхронний клієнт для взаємодії з Qdrant.
"""
from __future__ import annotations

import logging
from typing import Any, List, Dict, Optional
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct

logger = logging.getLogger("predator.qdrant_client")


class QdrantClient:
    """
    Асинхронний клієнт для Qdrant.
    
    Клас для взаємодії з Qdrant векторною базою даних.
    """
    
    def __init__(self, url: str, api_key: Optional[str] = None):
        """
        Ініціалізація клієнта.
        
        Args:
            url: URL для Qdrant
            api_key: API ключ (опціонально)
        """
        self.url = url
        self.api_key = api_key
        self.client = None
    
    async def connect(self):
        """Підключення до Qdrant."""
        try:
            self.client = QdrantClient(
                url=self.url,
                api_key=self.api_key
            )
            logger.info(f"Qdrant: підключено до {self.url}")
        except Exception as e:
            logger.error(f"Qdrant: помилка підключення: {e}")
            raise
    
    async def disconnect(self):
        """Відключення від Qdrant."""
        if self.client:
            self.client.close()
            logger.info("Qdrant: відключено")
    
    async def create_collection(
        self,
        collection_name: str,
        vector_size: int = 1536,
        distance: Distance = Distance.COSINE
    ):
        """
        Створення колекції.
        
        Args:
            collection_name: Назва колекції
            vector_size: Розмір вектора
            distance: Метрика відстані
        """
        if not self.client:
            await self.connect()
        
        try:
            self.client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(size=vector_size, distance=distance)
            )
            logger.info(f"Qdrant: колекцію {collection_name} створено")
        except Exception as e:
            logger.error(f"Qdrant: помилка створення колекції: {e}")
            raise
    
    async def search(
        self,
        collection_name: str,
        query_vector: List[float],
        limit: int = 10,
        score_threshold: Optional[float] = None
    ) -> List[Any]:
        """
        Пошук векторів.
        
        Args:
            collection_name: Назва колекції
            query_vector: Вектор запиту
            limit: Кількість результатів
            score_threshold: Поріг схожості
            
        Returns:
            list: Результати пошуку
        """
        if not self.client:
            await self.connect()
        
        try:
            search_result = self.client.search(
                collection_name=collection_name,
                query_vector=query_vector,
                limit=limit,
                score_threshold=score_threshold
            )
            return search_result
        except Exception as e:
            logger.error(f"Qdrant: помилка пошуку: {e}")
            raise
    
    async def upsert(
        self,
        collection_name: str,
        points: List[PointStruct]
    ):
        """
        Додавання/оновлення точок.
        
        Args:
            collection_name: Назва колекції
            points: Список точок
        """
        if not self.client:
            await self.connect()
        
        try:
            self.client.upsert(
                collection_name=collection_name,
                points=points
            )
            logger.info(f"Qdrant: додано {len(points)} точок в {collection_name}")
        except Exception as e:
            logger.error(f"Qdrant: помилка upsert: {e}")
            raise
    
    async def scroll(
        self,
        collection_name: str,
        limit: int = 10,
        with_payload: bool = True
    ) -> tuple[List[Any], Optional[Any]]:
        """
        Отримання точок з колекції.
        
        Args:
            collection_name: Назва колекції
            limit: Кількість точок
            with_payload: Чи повертати payload
            
        Returns:
            tuple: (точки, offset)
        """
        if not self.client:
            await self.connect()
        
        try:
            points, offset = self.client.scroll(
                collection_name=collection_name,
                limit=limit,
                with_payload=with_payload
            )
            return points, offset
        except Exception as e:
            logger.error(f"Qdrant: помилка scroll: {e}")
            raise


# Глобальний пул клієнтів
_qdrant_clients: Dict[str, QdrantClient] = {}


async def get_qdrant_client(settings: Any) -> QdrantClient:
    """
    Отримання Qdrant клієнта.
    
    Args:
        settings: Налаштування додатку
        
    Returns:
        QdrantClient: Клієнт Qdrant
    """
    cache_key = f"{settings.QDRANT_URL}:{settings.QDRANT_API_KEY}"
    
    if cache_key not in _qdrant_clients:
        client = QdrantClient(
            url=settings.QDRANT_URL,
            api_key=settings.QDRANT_API_KEY
        )
        await client.connect()
        _qdrant_clients[cache_key] = client
    
    return _qdrant_clients[cache_key]


async def close_all_qdrant_clients():
    """Закриття всіх клієнтів Qdrant."""
    for client in _qdrant_clients.values():
        await client.disconnect()
    _qdrant_clients.clear()
