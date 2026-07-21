"""ProZorro Continuous Polling Pipeline.

Реалізує патерн Continuous Polling для синхронізації тендерів з API ProZorro.
Використовує Redis для зберігання курсору (offset) та забезпечує near real-time 
оновлення без повторного викачування всієї бази.
"""
import asyncio
import logging
import os
from typing import Any

import httpx

from app.config import get_settings
from app.normalizers.prozorro_normalizer import ProzorroNormalizer

logger = logging.getLogger("ingestion_worker.prozorro_pipeline")

BASE_URL = "https://public.api.openprocurement.org/api/2.5/tenders"
CURSOR_KEY = "factory:cursor:prozorro:tenders"
BATCH_SIZE = 1000
POLL_INTERVAL_SECONDS = 300  # 5 minutes when no new data


class ProzorroPipeline:
    """Пайплайн для безперервної синхронізації ProZorro."""

    def __init__(self, neo4j_sink: Any) -> None:
        self.neo4j_sink = neo4j_sink
        self.normalizer = ProzorroNormalizer()
        self.settings = get_settings()
        
        self._nodes_buffer: dict[str, list[dict[str, Any]]] = {}
        self._edges_buffer: dict[str, list[dict[str, Any]]] = {}
        
        self._redis = None

    async def _get_redis(self) -> Any:
        if self._redis is None:
            import redis.asyncio as redis
            redis_url = getattr(self.settings, "REDIS_URL", "redis://localhost:6379/0")
            if "redis:" in redis_url and not os.environ.get("DOCKER_ENV"):
                redis_url = "redis://localhost:6379/0"
            self._redis = redis.from_url(redis_url)
        return self._redis

    async def process(self, msg_value: dict[str, Any]) -> None:
        """Головний цикл Continuous Polling."""
        logger.info("prozorro_pipeline.start")
        redis = await self._get_redis()
        
        # Відновлення курсору
        saved_offset = await redis.get(CURSOR_KEY)
        if saved_offset:
            current_url = f"{BASE_URL}?offset={saved_offset.decode('utf-8')}"
            logger.info("prozorro_pipeline.resume_from_cursor", extra={"url": current_url})
        else:
            # Завантаження з початку (або зі свіжого offset'у за замовчуванням, якщо потрібно)
            current_url = BASE_URL
            logger.info("prozorro_pipeline.start_fresh", extra={"url": current_url})

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                while True:
                    logger.debug("prozorro_pipeline.fetch", extra={"url": current_url})
                    response = await client.get(current_url)
                    
                    if response.status_code != 200:
                        logger.warning(f"prozorro_pipeline.api_error: {response.status_code}")
                        await asyncio.sleep(60)
                        continue
                        
                    data = response.json()
                    tenders = data.get("data", [])
                    
                    if not tenders:
                        # Ми досягли кінця фіду, спимо 5 хвилин
                        logger.info("prozorro_pipeline.up_to_date_sleeping", extra={"sleep": POLL_INTERVAL_SECONDS})
                        await asyncio.sleep(POLL_INTERVAL_SECONDS)
                        continue
                        
                    # Обробляємо пакет
                    for entity in tenders:
                        # Опціонально: тут можна робити детальний GET запит на кожен тендер, 
                        # але для швидкості ми беремо базові дані.
                        for item_type, item_data in self.normalizer.normalize(entity):
                            if item_type == "node":
                                self._buffer_node(item_data)
                            elif item_type == "edge":
                                self._buffer_edge(item_data)

                    await self._flush_all()
                    
                    # Оновлюємо курсор
                    next_page = data.get("next_page", {})
                    if "offset" in next_page:
                        offset = next_page["offset"]
                        await redis.set(CURSOR_KEY, offset)
                        current_url = next_page.get("uri", f"{BASE_URL}?offset={offset}")
                    else:
                        break

        except asyncio.CancelledError:
            logger.info("prozorro_pipeline.cancelled")
            await self._flush_all()
            raise
        except Exception as e:
            logger.error("prozorro_pipeline.error", extra={"error": str(e)}, exc_info=True)
            await self._flush_all()

    def _buffer_node(self, item_data: dict[str, Any]) -> None:
        label = item_data["label"]
        if label not in self._nodes_buffer:
            self._nodes_buffer[label] = []
        self._nodes_buffer[label].append(item_data)

    def _buffer_edge(self, item_data: dict[str, Any]) -> None:
        rel_type = item_data["rel_type"]
        if rel_type not in self._edges_buffer:
            self._edges_buffer[rel_type] = []
        self._edges_buffer[rel_type].append(item_data)

    async def _flush_all(self) -> None:
        """Запис усіх буферів у Neo4j."""
        if not self.neo4j_sink:
            return
            
        for label, batch in self._nodes_buffer.items():
            if batch:
                await self.neo4j_sink.merge_bulk_nodes(label, batch)
        self._nodes_buffer.clear()
        
        for rel_type, batch in self._edges_buffer.items():
            if batch:
                await self.neo4j_sink.merge_bulk_edges(rel_type, batch)
        self._edges_buffer.clear()
