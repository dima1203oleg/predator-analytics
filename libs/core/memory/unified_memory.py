"""
🧠 UNIFIED SEMANTIC MEMORY (v29.0)
==================================
Єдиний шар пам'яті для всіх агентів.
Маршрутизує дані між Redis, Qdrant та OpenSearch.
"""

import json
import logging
import time
import uuid
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime
import hashlib

# Client Imports (with fallback)
try:
    from redis.asyncio import Redis
except ImportError:
    Redis = None

try:
    from qdrant_client import AsyncQdrantClient
    from qdrant_client.http import models as qdrant_models
except ImportError:
    AsyncQdrantClient = None
    qdrant_models = None

try:
    from opensearchpy import AsyncOpenSearch
except ImportError:
    AsyncOpenSearch = None

# Embedding Import
try:
    from sentence_transformers import SentenceTransformer
    HAS_SENTENCE_TRANSFORMERS = True
except ImportError:
    HAS_SENTENCE_TRANSFORMERS = False

logger = logging.getLogger("unified-memory")

class MemoryEntry:
    def __init__(self, content: str, role: str, embedding: List[float] = None, metadata: Dict = None):
        self.id = hashlib.sha256(f"{content[:50]}{time.time()}".encode()).hexdigest()
        self.content = content
        self.role = role
        self.embedding = embedding or []
        self.metadata = metadata or {}
        self.timestamp = datetime.utcnow().isoformat()

class UnifiedMemoryManager:
    def __init__(self, redis_url: str = None, qdrant_url: str = None, opensearch_url: str = None):
        # Default URLs from environment or Docker DNS
        self.redis_url = redis_url or "redis://redis:6379/0"
        self.qdrant_url = qdrant_url or "http://qdrant:6333"
        self.opensearch_url = opensearch_url or "http://opensearch:9200"

        # Configuration
        self.collection_name = "semantic_memory"
        self.index_name = "memory_archive"
        self.vector_size = 384  # Matches all-MiniLM-L6-v2

        # Connections (Lazy loading)
        self._redis: Optional[Redis] = None
        self._qdrant: Optional[AsyncQdrantClient] = None
        self._opensearch: Optional[AsyncOpenSearch] = None

        # Embedding Model
        self._model = None

    @property
    def redis(self):
        if not self._redis and Redis:
            try:
                self._redis = Redis.from_url(self.redis_url, decode_responses=True)
                logger.info("✅ Redis connected")
            except Exception as e:
                logger.error(f"❌ Redis connection failed: {e}")
        return self._redis

    @property
    def qdrant(self):
        if not self._qdrant and AsyncQdrantClient:
            try:
                self._qdrant = AsyncQdrantClient(url=self.qdrant_url)
                logger.info("✅ Qdrant connected")
            except Exception as e:
                logger.error(f"❌ Qdrant connection failed: {e}")
        return self._qdrant

    @property
    def opensearch(self):
        if not self._opensearch and AsyncOpenSearch:
            try:
                self._opensearch = AsyncOpenSearch(
                    hosts=[self.opensearch_url],
                    http_compress=True,
                    use_ssl=False,
                    verify_certs=False
                )
                logger.info("✅ OpenSearch connected")
            except Exception as e:
                logger.error(f"❌ OpenSearch connection failed: {e}")
        return self._opensearch

    def _get_embedding(self, text: str) -> List[float]:
        """Generate embedding using sentence-transformers or fallback."""
        if HAS_SENTENCE_TRANSFORMERS:
            if not self._model:
                try:
                    self._model = SentenceTransformer('all-MiniLM-L6-v2')
                    logger.info("loaded_embedding_model: all-MiniLM-L6-v2")
                except Exception as e:
                    logger.error(f"Failed to load embedding model: {e}")

            if self._model:
                try:
                    return self._model.encode(text).tolist()
                except Exception as e:
                    logger.error(f"Embedding generation error: {e}")

        # Fallback: Zero vector
        return [0.0] * self.vector_size

    async def _ensure_qdrant_collection(self):
        """Ensure Qdrant collection exists."""
        if not self.qdrant:
            return

        try:
            collections = await self.qdrant.get_collections()
            exists = any(c.name == self.collection_name for c in collections.collections)

            if not exists:
                await self.qdrant.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=qdrant_models.VectorParams(
                        size=self.vector_size,
                        distance=qdrant_models.Distance.COSINE
                    )
                )
                logger.info(f"Created Qdrant collection: {self.collection_name}")
        except Exception as e:
            logger.error(f"Qdrant collection check failed: {e}")

    async def _ensure_opensearch_index(self):
        """Ensure OpenSearch index exists."""
        if not self.opensearch:
            return

        try:
            exists = await self.opensearch.indices.exists(index=self.index_name)
            if not exists:
                await self.opensearch.indices.create(index=self.index_name)
                logger.info(f"Created OpenSearch index: {self.index_name}")
        except Exception as e:
            logger.error(f"OpenSearch index check failed: {e}")

    async def store(self, content: str, role: str = "agent", tags: List[str] = None) -> str:
        """Зберегти спогад у всі шари пам'яті"""
        tags = tags or []
        embedding = self._get_embedding(content)
        entry = MemoryEntry(content, role, embedding=embedding, metadata={"tags": tags})

        logger.info(f"🧠 Remembering: {content[:30]}...")

        # 1. Short-term (Redis)
        if self.redis:
            try:
                key = f"memory:short:{entry.id}"
                data = {
                    "content": entry.content,
                    "role": entry.role,
                    "timestamp": entry.timestamp,
                    "tags": json.dumps(tags)
                }
                await self.redis.hset(key, mapping=data)
                await self.redis.expire(key, 86400) # 24h TTL
            except Exception as e:
                logger.error(f"Redis store failed: {e}")

        # 2. Long-term (Qdrant)
        if self.qdrant:
            await self._ensure_qdrant_collection()
            try:
                await self.qdrant.upsert(
                    collection_name=self.collection_name,
                    points=[
                        qdrant_models.PointStruct(
                            id=str(uuid.uuid4()),
                            vector=entry.embedding,
                            payload={
                                "content": entry.content,
                                "role": entry.role,
                                "timestamp": entry.timestamp,
                                "tags": tags,
                                "original_id": entry.id
                            }
                        )
                    ]
                )
            except Exception as e:
                 logger.error(f"Qdrant store failed: {e}")

        # 3. Archival (OpenSearch)
        if self.opensearch:
            await self._ensure_opensearch_index()
            try:
                doc = {
                    "content": entry.content,
                    "role": entry.role,
                    "timestamp": entry.timestamp,
                    "tags": tags,
                    "memory_id": entry.id
                }
                await self.opensearch.index(index=self.index_name, body=doc)
            except Exception as e:
                logger.error(f"OpenSearch store failed: {e}")

        return entry.id

    async def recall(self, query: str, limit: int = 5) -> List[Dict]:
        """Згадати релевантну інформацію (Semantic Search)"""
        logger.info(f"🧠 Recalling: {query}...")
        results = []

        # 1. Semantic Search (Qdrant)
        if self.qdrant:
            try:
                query_vector = self._get_embedding(query)
                search_result = await self.qdrant.search(
                    collection_name=self.collection_name,
                    query_vector=query_vector,
                    limit=limit
                )
                for hit in search_result:
                    results.append({
                        "content": hit.payload.get("content"),
                        "score": hit.score,
                        "source": "qdrant",
                        "role": hit.payload.get("role"),
                        "timestamp": hit.payload.get("timestamp")
                    })
            except Exception as e:
                logger.error(f"Qdrant recall failed: {e}")

        # 2. Keyword Search (OpenSearch) - if Qdrant yields few results
        if self.opensearch and len(results) < limit:
            try:
                os_response = await self.opensearch.search(
                    index=self.index_name,
                    body={
                        "query": {
                            "match": {
                                "content": query
                            }
                        },
                        "size": limit
                    }
                )
                for hit in os_response['hits']['hits']:
                    source = hit['_source']
                    # Simple duplicate check could be added here
                    results.append({
                        "content": source.get("content"),
                        "score": hit['_score'], # Not normalized 0-1 like Cosine
                        "source": "opensearch",
                        "role": source.get("role"),
                        "timestamp": source.get("timestamp")
                    })
            except Exception as e:
                logger.error(f"OpenSearch recall failed: {e}")

        # Sort by score (approximate since scores are different scales)
        # For mixed results, we might prioritize Qdrant's cosine score
        results.sort(key=lambda x: x.get("score", 0), reverse=True)
        return results[:limit]

    async def archive_old_memories(self, days: int = 30):
        """
        Переміщення старих спогадів з Qdrant (Long-term) в OpenSearch (Archive only).
        Оскільки store() вже пише в обидва місця, 'архівація' тут означає видалення з Qdrant.
        """
        if not self.qdrant:
            return

        from datetime import timedelta
        threshold = (datetime.utcnow() - timedelta(days=days)).isoformat()

        logger.info(f"🧠 Archiving memories older than {threshold}...")

        try:
            # Видаляємо з Qdrant за фільтром дати
            await self.qdrant.delete(
                collection_name=self.collection_name,
                points_selector=qdrant_models.FilterSelector(
                    filter=qdrant_models.Filter(
                        must=[
                            qdrant_models.FieldCondition(
                                key="timestamp",
                                range=qdrant_models.Range(
                                    lt=threshold
                                )
                            )
                        ]
                    )
                )
            )
            logger.info("✅ Old memories archived from Qdrant")
        except Exception as e:
            logger.error(f"Archiving failed: {e}")

    async def reflect(self):

# Singleton instance
memory_manager = UnifiedMemoryManager()
