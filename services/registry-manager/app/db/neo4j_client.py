"""
Neo4j Client — PREDATOR Registry Manager
"""
import logging
import os
from neo4j import AsyncGraphDatabase

logger = logging.getLogger(__name__)

class Neo4jClient:
    def __init__(self):
        self.uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
        self.user = os.getenv("NEO4J_USER", "neo4j")
        self.password = os.getenv("NEO4J_PASSWORD", "password")
        
        try:
            self.driver = AsyncGraphDatabase.driver(self.uri, auth=(self.user, self.password))
            logger.info("Initialized Neo4jClient")
        except Exception as e:
            logger.error(f"Failed to initialize Neo4jClient: {e}")
            self.driver = None

    async def save_entity(self, data: dict):
        """Зберігає або оновлює вузол та його зв'язки."""
        if not self.driver:
            return
            
        entity_type = data.get("entity_type")
        ueid = data.get("ueid")
        
        if not entity_type or not ueid:
            logger.warning("Cannot save to Neo4j: missing entity_type or ueid")
            return
            
        query = f"""
        MERGE (n:{entity_type} {{ueid: $ueid}})
        SET n += $props
        """
        
        # Виключаємо спеціальні поля з властивостей
        props = {k: v for k, v in data.items() if k not in ["entity_type", "ueid", "relations"]}
        
        async with self.driver.session() as session:
            try:
                await session.run(query, ueid=ueid, props=props)
                
                # Обробка зв'язків
                relations = data.get("relations", [])
                for rel in relations:
                    await self._create_relation(session, entity_type, ueid, rel)
            except Exception as e:
                logger.error(f"Error saving to Neo4j: {e}")

    async def _create_relation(self, session, source_type: str, source_ueid: str, relation: dict):
        rel_type = relation.get("type")
        target = relation.get("target")
        
        if not rel_type or not target:
            return
            
        target_type = target.get("entity_type")
        target_ueid = target.get("ueid")
        
        if not target_type or not target_ueid:
            return
            
        # Створюємо цільовий вузол, якщо його немає
        target_props = {k: v for k, v in target.items() if k not in ["entity_type", "ueid"]}
        
        query = f"""
        MATCH (a:{source_type} {{ueid: $source_ueid}})
        MERGE (b:{target_type} {{ueid: $target_ueid}})
        ON CREATE SET b += $target_props
        MERGE (a)-[r:{rel_type}]->(b)
        """
        await session.run(query, source_ueid=source_ueid, target_ueid=target_ueid, target_props=target_props)

    async def close(self):
        if self.driver:
            await self.driver.close()
