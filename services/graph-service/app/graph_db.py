"""
Graph Database Connection — PREDATOR Analytics v55.1 Ironclad.

Neo4j connection singleton.
"""
from typing import Optional, Dict, Any, List
from neo4j import AsyncGraphDatabase, AsyncDriver
from app.config import get_settings
import logging

logger = logging.getLogger("graph_service.db")
settings = get_settings()

class GraphDatabase:
    def __init__(self):
        self._driver: Optional[AsyncDriver] = None

    async def connect(self):
        """Ініціалізація з'єднання з Neo4j."""
        try:
            self._driver = AsyncGraphDatabase.driver(
                settings.NEO4J_URI,
                auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD),
                max_connection_lifetime=3600,
                max_connection_pool_size=50,
                connection_acquisition_timeout=60.0
            )
            # Перевірка з'єднання
            async with self._driver.session() as session:
                await session.run("RETURN 1")
            logger.info("Успішно підключено до Neo4j")
        except Exception as e:
            logger.error(f"Помилка підключення до Neo4j: {e}")
            raise

    async def disconnect(self):
        """Закриття з'єднання з Neo4j."""
        if self._driver:
            await self._driver.close()
            logger.info("З'єднання з Neo4j закрито")

    async def run_query(self, query: str, parameters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Виконання Cypher запиту та повернення результатів."""
        if not self._driver:
            raise RuntimeError("Драйвер Neo4j не ініціалізовано. Викличте connect() спочатку.")
            
        async with self._driver.session() as session:
            result = await session.run(query, parameters or {})
            records = await result.data()
            return records

graph_db = GraphDatabase()
