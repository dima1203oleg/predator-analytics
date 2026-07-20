"""
Qdrant Client — PREDATOR Registry Manager
"""
import logging
import os
import uuid
from qdrant_client import AsyncQdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct

logger = logging.getLogger(__name__)

class QdrantVectorClient:
    def __init__(self):
        self.host = os.getenv("QDRANT_HOST", "localhost")
        self.port = int(os.getenv("QDRANT_PORT", 6333))
        
        try:
            self.client = AsyncQdrantClient(host=self.host, port=self.port)
            logger.info("Initialized QdrantVectorClient")
        except Exception as e:
            logger.error(f"Failed to initialize QdrantVectorClient: {e}")
            self.client = None

    async def _ensure_collection(self, collection_name: str, vector_size: int = 1536):
        """Перевіряє наявність колекції, створює якщо немає."""
        try:
            collections = await self.client.get_collections()
            names = [c.name for c in collections.collections]
            
            if collection_name not in names:
                await self.client.create_collection(
                    collection_name=collection_name,
                    vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE),
                )
                logger.info(f"Created Qdrant collection: {collection_name}")
        except Exception as e:
            logger.error(f"Error checking/creating Qdrant collection: {e}")

    async def save_embedding(self, data: dict, vector: list[float]):
        """Зберігає вектор в Qdrant."""
        if not self.client or not vector:
            return
            
        entity_type = data.get("entity_type")
        ueid = data.get("ueid")
        
        if not entity_type or not ueid:
            return
            
        collection_name = f"predator_{entity_type.lower()}s"
        
        try:
            await self._ensure_collection(collection_name, len(vector))
            
            # Генеруємо UUID на основі UEID (бо Qdrant вимагає UUID або Int)
            import uuid
            point_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, ueid))
            
            payload = {k: v for k, v in data.items() if k not in ["relations"]}
            
            await self.client.upsert(
                collection_name=collection_name,
                points=[
                    PointStruct(
                        id=point_id,
                        vector=vector,
                        payload=payload
                    )
                ]
            )
        except Exception as e:
            logger.error(f"Error saving embedding to Qdrant: {e}")

    async def close(self):
        # AsyncQdrantClient does not have a close method, HTTP connections are pooled
        pass
