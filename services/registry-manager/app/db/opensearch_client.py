"""
OpenSearch Client — PREDATOR Registry Manager
"""
import logging
import os
try:
    from opensearchpy import AsyncOpenSearch
except ImportError:
    AsyncOpenSearch = None  # type: ignore

logger = logging.getLogger(__name__)

class OpenSearchClient:
    def __init__(self):
        self.host = os.getenv("OPENSEARCH_HOST", "localhost")
        self.port = int(os.getenv("OPENSEARCH_PORT", 9200))
        self.user = os.getenv("OPENSEARCH_USER", "admin")
        self.password = os.getenv("OPENSEARCH_PASSWORD", "admin")
        
        try:
            if AsyncOpenSearch:
                self.client = AsyncOpenSearch(
                    hosts=[{'host': self.host, 'port': self.port}],
                    http_auth=(self.user, self.password),
                    use_ssl=False,
                    verify_certs=False,
                    ssl_show_warn=False
                )
                logger.info("Initialized OpenSearchClient")
            else:
                self.client = None
                logger.warning("opensearchpy not installed, OpenSearchClient disabled")
        except Exception as e:
            logger.error(f"Failed to initialize OpenSearchClient: {e}")
            self.client = None

    async def index_document(self, data: dict):
        """Індексує документ для повнотекстового пошуку."""
        if not self.client:
            return
            
        entity_type = data.get("entity_type")
        ueid = data.get("ueid")
        
        if not entity_type or not ueid:
            return
            
        index_name = f"predator_{entity_type.lower()}s"
        
        try:
            # Створюємо індекс, якщо він не існує
            exists = await self.client.indices.exists(index=index_name)
            if not exists:
                await self.client.indices.create(index=index_name)
                
            # Індексуємо документ
            # Використовуємо ueid як _id документа
            await self.client.index(
                index=index_name,
                body=data,
                id=ueid,
                refresh=True
            )
        except Exception as e:
            logger.error(f"Error indexing document in OpenSearch: {e}")

    async def close(self):
        if self.client:
            await self.client.close()
