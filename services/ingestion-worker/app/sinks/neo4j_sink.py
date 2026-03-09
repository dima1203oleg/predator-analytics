"""
Neo4j Sink — PREDATOR Analytics v55.1 Ironclad.

Efficient relationship and node writing to Neo4j.
"""
from typing import List, Dict, Any
from neo4j import AsyncGraphDatabase
from app.config import get_settings

settings = get_settings()

class Neo4jSink:
    def __init__(self):
        self.driver = AsyncGraphDatabase.driver(
            settings.NEO4J_URI, 
            auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD)
        )

    async def merge_company(self, data: Dict[str, Any]):
        """Створення або оновлення вузла компанії."""
        query = """
        MERGE (c:Company {ueid: $ueid})
        SET c += {
            name: $name,
            edrpou: $edrpou,
            tenant_id: $tenant_id,
            last_updated: datetime()
        }
        """
        async with self.driver.session() as session:
            await session.run(query, data)

    async def close(self):
        await self.driver.close()
