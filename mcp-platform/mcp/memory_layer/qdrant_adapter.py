"""Qdrant adapter для векторної БД."""
from __future__ import annotations

from typing import Any, Optional


class QdrantError(Exception):
    """Базова помилка для Qdrant операцій."""

    pass


class QdrantAdapter:
    """Adapter для Qdrant vector database."""

    def __init__(
        self,
        url: str = "http://localhost:6333",
        collection_name: str = "predator_vectors",
    ) -> None:
        """Ініціалізувати Qdrant adapter.

        Args:
            url: URL Qdrant сервера
            collection_name: Назва колекції
        """
        self.url = url
        self.collection_name = collection_name
        self.client = None
        self._is_connected = False

    async def connect(self) -> bool:
        """Підключитися до Qdrant."""
        try:
            from qdrant_client import AsyncQdrantClient

            self.client = AsyncQdrantClient(url=self.url)
            self._is_connected = True
            return True
        except ImportError:
            raise QdrantError("qdrant-client не встановлено")
        except Exception as e:
            raise QdrantError(f"Помилка підключення: {str(e)}") from e

    async def disconnect(self) -> bool:
        """Відключитися від Qdrant."""
        if self.client:
            await self.client.close()
            self._is_connected = False
        return True

    async def create_collection(
        self,
        vector_size: int = 384,
    ) -> bool:
        """Створити колекцію.

        Args:
            vector_size: Розмір вектора

        Returns:
            True якщо успішно
        """
        if not self._is_connected:
            await self.connect()

        try:
            from qdrant_client.models import Distance, VectorParams

            await self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE),
            )
            return True
        except Exception as e:
            raise QdrantError(f"Помилка створення колекції: {str(e)}") from e

    async def upsert(
        self,
        vector_id: str,
        vector: list[float],
        payload: Optional[dict[str, Any]] = None,
    ) -> bool:
        """Вставити або оновити вектор.

        Args:
            vector_id: Унікальний ID вектора
            vector: Вектор значень
            payload: Додаткові дані (метадані)

        Returns:
            True якщо успішно
        """
        if not self._is_connected:
            await self.connect()

        try:
            from qdrant_client.models import PointStruct

            point = PointStruct(
                id=hash(vector_id) % (2**63),
                vector=vector,
                payload={"vector_id": vector_id, **(payload or {})},
            )

            await self.client.upsert(
                collection_name=self.collection_name,
                points=[point],
            )
            return True
        except Exception as e:
            raise QdrantError(f"Помилка upsert: {str(e)}") from e

    async def search(
        self,
        query_vector: list[float],
        k: int = 5,
    ) -> list[dict[str, Any]]:
        """Пошук подібних векторів.

        Args:
            query_vector: Вектор запиту
            k: Кількість результатів

        Returns:
            Список найближчих результатів
        """
        if not self._is_connected:
            await self.connect()

        try:
            results = await self.client.search(
                collection_name=self.collection_name,
                query_vector=query_vector,
                limit=k,
            )

            return [
                {
                    "id": result.id,
                    "score": result.score,
                    "payload": result.payload,
                }
                for result in results
            ]
        except Exception as e:
            raise QdrantError(f"Помилка пошуку: {str(e)}") from e

    async def delete(self, vector_id: str) -> bool:
        """Видалити вектор.

        Args:
            vector_id: ID вектора

        Returns:
            True якщо успішно
        """
        if not self._is_connected:
            await self.connect()

        try:
            await self.client.delete(
                collection_name=self.collection_name,
                points_selector={"ids": [hash(vector_id) % (2**63)]},
            )
            return True
        except Exception as e:
            raise QdrantError(f"Помилка видалення: {str(e)}") from e

    async def clear_collection(self) -> bool:
        """Очистити колекцію."""
        if not self._is_connected:
            await self.connect()

        try:
            await self.client.delete_collection(collection_name=self.collection_name)
            await self.create_collection()
            return True
        except Exception as e:
            raise QdrantError(f"Помилка очищення: {str(e)}") from e

    async def get_stats(self) -> dict[str, Any]:
        """Отримати статистику колекції."""
        if not self._is_connected:
            await self.connect()

        try:
            collection_info = await self.client.get_collection(
                collection_name=self.collection_name
            )
            return {
                "name": self.collection_name,
                "points_count": collection_info.points_count,
                "vectors_count": collection_info.vectors_count,
                "status": collection_info.status,
            }
        except Exception as e:
            return {"error": str(e), "connected": self._is_connected}
