"""
Neo4j Driver Wrapper — PREDATOR Analytics v55.1 Ironclad.

Graph persistence and relationship queries.
"""
from typing import List, Dict, Any, Optional
from neo4j import AsyncGraphDatabase, AsyncDriver
from app.config import get_settings

settings = get_settings()

class GraphDB:
    """Керування з'єднанням з Neo4j."""
    def __init__(self):
        self.driver: Optional[AsyncDriver] = None

    def init_driver(self):
        """Ініціалізація драйвера."""
        self.driver = AsyncGraphDatabase.driver(
            settings.NEO4J_URI,
            auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD)
        )

    async def close(self):
        """Закриття драйвера."""
        if self.driver:
            await self.driver.close()

    async def run_query(self, query: str, parameters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Виконання Cypher запиту."""
        if not self.driver:
            raise RuntimeError("Neo4j driver not initialized")
            
        params = parameters or {}
        async with self.driver.session() as session:
            result = await session.run(query, params)
            records = await result.data()
            return records

# Singleton instance
graph_db = GraphDB()
