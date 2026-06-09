"""
Vector Semantic Router для PREDATOR Analytics v56.5-ELITE
Перед тим як генерувати запит, система через Qdrant шукає в базі "схожі минулі розслідування",
щоб зрозуміти контекст і використати вже перевірені алгоритми пошуку.
"""
from __future__ import annotations

import logging
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

logger = logging.getLogger("predator_vector_router")


class VectorSemanticRouter:
    """
    Vector Semantic Router для пошуку схожих розслідувань.
    
    Перед тим як генерувати запит, система через Qdrant шукає в базі "схожі минулі розслідування",
    щоб зрозуміти контекст і використати вже перевірені алгоритми пошуку.
    """
    
    def __init__(
        self,
        qdrant_client: Any,
        embedding_model: Any,
        collection_name: str = "investigations"
    ):
        """
        Ініціалізація Vector Semantic Router.
        
        Args:
            qdrant_client: Клієнт Qdrant
            embedding_model: Модель для генерації embeddings
            collection_name: Назва колекції в Qdrant
        """
        self.qdrant = qdrant_client
        self.embedding_model = embedding_model
        self.collection_name = collection_name
        
        # Створення колекції, якщо не існує
        self._ensure_collection_exists()
    
    def _ensure_collection_exists(self):
        """Створення колекції, якщо не існує."""
        try:
            collections = self.qdrant.get_collections()
            collection_names = [c.name for c in collections.collections]
            
            if self.collection_name not in collection_names:
                logger.info(f"Створення колекції {self.collection_name}")
                self.qdrant.create_collection(
                    collection_name=self.collection_name,
                    vectors_config={
                        "size": 1536,  # Розмір вектора (залежить від моделі)
                        "distance": "Cosine"
                    }
                )
        except Exception as e:
            logger.error(f"Помилка при створенні колекції: {e}")
    
    async def route(self, query: str, limit: int = 5, score_threshold: float = 0.7) -> Dict[str, Any]:
        """
        Vector Semantic Router для пошуку схожих розслідувань.
        
        Args:
            query: Запит користувача
            limit: Кількість схожих розслідувань для повернення
            score_threshold: Поріг схожості
            
        Returns:
            dict: Контекст з найбільш схожими розслідуваннями
        """
        
        logger.info(f"Vector Semantic Router: Пошук схожих розслідувань для: {query}")
        
        # 1. Генерація embedding для запиту
        query_embedding = await self.embedding_model.embed(query)
        
        # 2. Пошук схожих розслідувань в Qdrant
        try:
            similar_investigations = await self.qdrant.search(
                collection_name=self.collection_name,
                query_vector=query_embedding,
                limit=limit,
                score_threshold=score_threshold
            )
        except Exception as e:
            logger.error(f"Помилка пошуку в Qdrant: {e}")
            return {
                "query": query,
                "context": None,
                "confidence": 0.0,
                "error": str(e)
            }
        
        if similar_investigations and len(similar_investigations) > 0:
            # 3. Використання контексту з схожих розслідувань
            context = {
                "similar_queries": [inv.payload.get("query", "") for inv in similar_investigations],
                "successful_patterns": [inv.payload.get("pattern", "") for inv in similar_investigations],
                "cypher_queries": [inv.payload.get("cypher_query", "") for inv in similar_investigations],
                "timestamps": [inv.payload.get("timestamp", "") for inv in similar_investigations]
            }
            
            confidence = max([inv.score for inv in similar_investigations])
            
            logger.info(f"Vector Semantic Router: Знайдено {len(similar_investigations)} схожих розслідувань (confidence: {confidence:.2f})")
            
            return {
                "query": query,
                "context": context,
                "confidence": confidence,
                "similar_count": len(similar_investigations)
            }
        else:
            # 5. Нове розслідування без контексту
            logger.info(f"Vector Semantic Router: Схожі розслідування не знайдено")
            
            return {
                "query": query,
                "context": None,
                "confidence": 0.0,
                "similar_count": 0
            }
    
    async def save_investigation(
        self,
        query: str,
        cypher_query: str,
        result: Any,
        pattern: Optional[str] = None
    ) -> None:
        """
        Збереження контексту розслідування в Qdrant.
        
        Args:
            query: Запит користувача
            cypher_query: Cypher запит
            result: Результат виконання
            pattern: Використаний патерн
        """
        
        logger.info(f"Vector Semantic Router: Збереження розслідування: {query}")
        
        # Генерація embedding для запиту
        query_embedding = await self.embedding_model.embed(query)
        
        # Збереження в Qdrant
        try:
            await self.qdrant.upsert(
                collection_name=self.collection_name,
                points=[
                    {
                        "id": str(uuid.uuid4()),
                        "vector": query_embedding,
                        "payload": {
                            "query": query,
                            "cypher_query": cypher_query,
                            "result": str(result),
                            "pattern": pattern,
                            "timestamp": datetime.now().isoformat()
                        }
                    }
                ]
            )
            logger.info(f"Vector Semantic Router: Розслідування успішно збережено")
        except Exception as e:
            logger.error(f"Помилка збереження в Qdrant: {e}")
    
    async def get_investigation_history(self, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Отримання історії розслідувань.
        
        Args:
            limit: Кількість розслідувань для повернення
            
        Returns:
            list: Історія розслідувань
        """
        
        try:
            # Отримання всіх точок з колекції
            points = await self.qdrant.scroll(
                collection_name=self.collection_name,
                limit=limit,
                with_payload=True
            )
            
            investigations = []
            for point in points[0]:
                investigations.append({
                    "id": point.id,
                    "query": point.payload.get("query", ""),
                    "pattern": point.payload.get("pattern", ""),
                    "timestamp": point.payload.get("timestamp", "")
                })
            
            return investigations
        except Exception as e:
            logger.error(f"Помилка отримання історії: {e}")
            return []


class EmbeddingModel:
    """
    Базовий клас для моделей embeddings.
    
    Абстракція для різних моделей генерації embeddings.
    """
    
    async def embed(self, text: str) -> List[float]:
        """
        Генерація embedding для тексту.
        
        Args:
            text: Текст для генерації embedding
            
        Returns:
            list: Вектор embedding
        """
        raise NotImplementedError


class OpenAIEmbeddingModel(EmbeddingModel):
    """
    OpenAI модель для генерації embeddings.
    
    Використовує OpenAI API для генерації embeddings.
    """
    
    def __init__(self, api_key: str, model: str = "text-embedding-3-small"):
        """
        Ініціалізація моделі.
        
        Args:
            api_key: API ключ OpenAI
            model: Назва моделі
        """
        self.api_key = api_key
        self.model = model
    
    async def embed(self, text: str) -> List[float]:
        """
        Генерація embedding для тексту.
        
        Args:
            text: Текст для генерації embedding
            
        Returns:
            list: Вектор embedding
        """
        # Тут має бути реалізація через OpenAI API
        # Для прикладу повертаємо заглушку
        return [0.0] * 1536


class LocalEmbeddingModel(EmbeddingModel):
    """
    Локальна модель для генерації embeddings.
    
    Використовує локальну модель (наприклад, через sentence-transformers).
    """
    
    def __init__(self, model_path: str):
        """
        Ініціалізація моделі.
        
        Args:
            model_path: Шлях до моделі
        """
        self.model_path = model_path
        # Тут має бути завантаження моделі
    
    async def embed(self, text: str) -> List[float]:
        """
        Генерація embedding для тексту.
        
        Args:
            text: Текст для генерації embedding
            
        Returns:
            list: Вектор embedding
        """
        # Тут має бути реалізація через локальну модель
        # Для прикладу повертаємо заглушку
        return [0.0] * 1536


def create_vector_router(
    qdrant_client: Any,
    embedding_model: EmbeddingModel,
    collection_name: str = "investigations"
) -> VectorSemanticRouter:
    """
    Фабрика для створення Vector Semantic Router.
    
    Args:
        qdrant_client: Клієнт Qdrant
        embedding_model: Модель для генерації embeddings
        collection_name: Назва колекції в Qdrant
        
    Returns:
        VectorSemanticRouter: Ініціалізований router
    """
    
    router = VectorSemanticRouter(
        qdrant_client=qdrant_client,
        embedding_model=embedding_model,
        collection_name=collection_name
    )
    
    return router
