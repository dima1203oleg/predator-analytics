"""
Storage Router — PREDATOR Registry Manager
Розділ 10. Побудова сховищ
Розділ 11. Побудова графа
Розділ 12. Повнотекстовий пошук
Розділ 13. Векторний пошук
"""
import logging
from app.db.neo4j_client import Neo4jClient
from app.db.opensearch_client import OpenSearchClient
from app.db.qdrant_client import QdrantVectorClient

logger = logging.getLogger(__name__)

class StorageRouter:
    def __init__(self):
        logger.info("Initializing Storage Router")
        self.neo4j_client = Neo4jClient()
        self.opensearch_client = OpenSearchClient()
        self.qdrant_client = QdrantVectorClient()

    async def route_data(self, normalized_data: dict):
        """
        Одночасний запис нормалізованих даних у 6 БД.
        """
        logger.info("Routing data to multiple destinations")
        await self._write_to_postgres(normalized_data)
        await self._write_to_clickhouse(normalized_data)
        await self._write_to_neo4j(normalized_data)
        await self._write_to_opensearch(normalized_data)
        await self._write_to_qdrant(normalized_data)
        await self._write_to_redis(normalized_data)

    async def _write_to_postgres(self, data: dict):
        # Transactional SSOT
        pass

    async def _write_to_clickhouse(self, data: dict):
        # OLAP
        pass

    async def _write_to_neo4j(self, data: dict):
        entity_type = data.get("entity_type")
        if entity_type in ["Company", "Person", "Tender", "SanctionedEntity", "CryptoWallet", "Email", "InterpolNode", "DataLeak"]:
            await self.neo4j_client.save_entity(data)

    async def _write_to_opensearch(self, data: dict):
        if "searchable_text" in data:
            await self.opensearch_client.index_document(data)

    async def _write_to_qdrant(self, data: dict):
        # Якщо є текст для векторизації (наприклад, searchable_text)
        text_to_embed = data.get("searchable_text")
        if text_to_embed:
            # Для демо генеруємо фейковий вектор. У реальності тут LiteLLM.
            dummy_vector = [0.1] * 1536 
            await self.qdrant_client.save_embedding(data, dummy_vector)

    async def _write_to_redis(self, data: dict):
        # Кешування
        pass
