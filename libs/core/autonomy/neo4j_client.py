"""
Neo4j Client для PREDATOR Analytics v56.5-ELITE
Асинхронний клієнт для взаємодії з Neo4j.
"""
from __future__ import annotations

import logging
from typing import Any, List, Dict, Optional
from neo4j import AsyncGraphDatabase

logger = logging.getLogger("predator.neo4j_client")


class Neo4jClient:
    """
    Асинхронний клієнт для Neo4j.
    
    Клас для взаємодії з Neo4j графовою базою даних.
    """
    
    def __init__(self, uri: str, user: str, password: str):
        """
        Ініціалізація клієнта.
        
        Args:
            uri: URI для Neo4j
            user: Користувач Neo4j
            password: Пароль Neo4j
        """
        self.uri = uri
        self.user = user
        self.password = password
        self.driver = None
    
    async def connect(self):
        """Підключення до Neo4j."""
        try:
            self.driver = AsyncGraphDatabase.auth(
                self.uri,
                (self.user, self.password)
            )
            logger.info(f"Neo4j: підключено до {self.uri}")
        except Exception as e:
            logger.error(f"Neo4j: помилка підключення: {e}")
            raise
    
    async def disconnect(self):
        """Відключення від Neo4j."""
        if self.driver:
            await self.driver.close()
            logger.info("Neo4j: відключено")
    
    async def execute(self, query: str, parameters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        Виконання Cypher запиту.
        
        Args:
            query: Cypher запит
            parameters: Параметри запиту
            
        Returns:
            list: Результат виконання
        """
        if not self.driver:
            await self.connect()
        
        try:
            async with self.driver.session() as session:
                result = await session.run(query, parameters or {})
                records = await result.data()
                return records
        except Exception as e:
            logger.error(f"Neo4j: помилка виконання запиту: {e}")
            raise
    
    async def execute_write(self, query: str, parameters: Optional[Dict[str, Any]] = None) -> Any:
        """
        Виконання write-операції (CREATE, UPDATE, DELETE).
        
        Args:
            query: Cypher запит
            parameters: Параметри запиту
            
        Returns:
            Any: Результат виконання
        """
        if not self.driver:
            await self.connect()
        
        try:
            async with self.driver.session() as session:
                result = await session.run(query, parameters or {})
                summary = await result.consume()
                return summary
        except Exception as e:
            logger.error(f"Neo4j: помилка write-операції: {e}")
            raise


# Глобальний пул клієнтів
_neo4j_clients: Dict[str, Neo4jClient] = {}


async def get_neo4j_client(settings: Any) -> Neo4jClient:
    """
    Отримання Neo4j клієнта.
    
    Args:
        settings: Налаштування додатку
        
    Returns:
        Neo4jClient: Клієнт Neo4j
    """
    cache_key = f"{settings.NEO4J_URI}:{settings.NEO4J_USER}"
    
    if cache_key not in _neo4j_clients:
        client = Neo4jClient(
            uri=settings.NEO4J_URI,
            user=settings.NEO4J_USER,
            password=settings.NEO4J_PASSWORD
        )
        await client.connect()
        _neo4j_clients[cache_key] = client
    
    return _neo4j_clients[cache_key]


async def close_all_neo4j_clients():
    """Закриття всіх клієнтів Neo4j."""
    for client in _neo4j_clients.values():
        await client.disconnect()
    _neo4j_clients.clear()
