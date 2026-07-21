"""Meta-Graph Schema Definition.

Модуль відповідає за створення Constraints та Indexes для 
Knowledge Graph of Sources (Meta-Graph) у Neo4j.
"""
import logging
from typing import Any

logger = logging.getLogger("core_api.neo4j_meta_schema")


class MetaGraphSchemaManager:
    """Керує схемою мета-графа джерел в Neo4j."""
    
    def __init__(self, driver: Any) -> None:
        self.driver = driver
        
    async def init_schema(self) -> None:
        """Ініціалізація бази даних. Створення Constraints та Indexes."""
        logger.info("MetaGraphSchemaManager: Ініціалізація схеми...")
        
        queries = [
            # DataSource
            "CREATE CONSTRAINT ds_id IF NOT EXISTS FOR (n:DataSource) REQUIRE n.id IS UNIQUE",
            "CREATE INDEX ds_name IF NOT EXISTS FOR (n:DataSource) ON (n.name)",
            "CREATE INDEX ds_status IF NOT EXISTS FOR (n:DataSource) ON (n.status)",
            
            # API
            "CREATE CONSTRAINT api_id IF NOT EXISTS FOR (n:API) REQUIRE n.id IS UNIQUE",
            "CREATE INDEX api_url IF NOT EXISTS FOR (n:API) ON (n.url)",
            
            # Dataset
            "CREATE CONSTRAINT dataset_id IF NOT EXISTS FOR (n:Dataset) REQUIRE n.id IS UNIQUE",
            
            # Schema
            "CREATE CONSTRAINT schema_id IF NOT EXISTS FOR (n:Schema) REQUIRE n.id IS UNIQUE",
            
            # Registry
            "CREATE CONSTRAINT registry_id IF NOT EXISTS FOR (n:Registry) REQUIRE n.id IS UNIQUE",
        ]
        
        async with self.driver.session() as session:
            for query in queries:
                try:
                    await session.run(query)
                except Exception as e:
                    logger.error(f"Помилка створення схеми: {e}")
                    
        logger.info("MetaGraphSchemaManager: Ініціалізація схеми завершена успішно.")

    async def get_meta_stats(self) -> dict[str, int]:
        """Отримати загальну статистику по знайдених джерелах."""
        query = """
        MATCH (n) 
        WHERE any(label IN labels(n) WHERE label IN ['DataSource', 'API', 'Dataset', 'Registry', 'Schema']) 
        RETURN labels(n)[0] as type, count(n) as count
        """
        stats = {}
        async with self.driver.session() as session:
            result = await session.run(query)
            async for record in result:
                stats[record["type"]] = record["count"]
                
        return stats
