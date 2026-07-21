"""OpenSanctions Bulk Streaming Pipeline.

Забезпечує потокове викачування, нормалізацію та масовий запис OpenSanctions в Neo4j
без переповнення оперативної пам'яті (OOM).
"""
import json
import logging
from typing import Any

import httpx

from app.normalizers.opensanctions_normalizer import OpenSanctionsNormalizer

logger = logging.getLogger("ingestion_worker.opensanctions_pipeline")

DATASET_URL = "https://data.opensanctions.org/datasets/latest/default/entities.ftm.json"
BATCH_SIZE = 1000


class OpenSanctionsPipeline:
    """Пайплайн для повної синхронізації OpenSanctions."""

    def __init__(self, neo4j_sink: Any) -> None:
        self.neo4j_sink = neo4j_sink
        self.normalizer = OpenSanctionsNormalizer()
        
        # Буфери для пакетного запису
        self._nodes_buffer: dict[str, list[dict[str, Any]]] = {}
        self._edges_buffer: dict[str, list[dict[str, Any]]] = {}
        self._processed_count = 0

    async def process(self, msg_value: dict[str, Any]) -> None:
        """Обробляє повідомлення про запуск та стартує стрімінг."""
        url = msg_value.get("dataset_url", DATASET_URL)
        logger.info(f"opensanctions_pipeline.start", extra={"url": url})

        try:
            async with httpx.AsyncClient(timeout=None) as client:
                async with client.stream("GET", url) as response:
                    response.raise_for_status()
                    
                    async for line in response.aiter_lines():
                        if not line:
                            continue
                        
                        try:
                            entity = json.loads(line)
                        except json.JSONDecodeError:
                            continue
                        
                        # Нормалізація (FtM -> Neo4j)
                        for item_type, item_data in self.normalizer.normalize(entity):
                            if item_type == "node":
                                label = item_data["label"]
                                if label not in self._nodes_buffer:
                                    self._nodes_buffer[label] = []
                                self._nodes_buffer[label].append(item_data)
                                
                                if len(self._nodes_buffer[label]) >= BATCH_SIZE:
                                    await self._flush_nodes(label)
                                    
                            elif item_type == "edge":
                                rel_type = item_data["rel_type"]
                                if rel_type not in self._edges_buffer:
                                    self._edges_buffer[rel_type] = []
                                self._edges_buffer[rel_type].append(item_data)
                                
                                if len(self._edges_buffer[rel_type]) >= BATCH_SIZE:
                                    await self._flush_edges(rel_type)

                        self._processed_count += 1
                        if self._processed_count % 10000 == 0:
                            logger.info(f"opensanctions_pipeline.progress", extra={"processed": self._processed_count})

            # Запис залишків
            await self._flush_all()
            logger.info(f"opensanctions_pipeline.completed", extra={"total_processed": self._processed_count})

        except Exception as e:
            logger.error("opensanctions_pipeline.failed", extra={"error": str(e)}, exc_info=True)

    async def _flush_nodes(self, label: str) -> None:
        batch = self._nodes_buffer.get(label, [])
        if batch and self.neo4j_sink:
            await self.neo4j_sink.merge_bulk_nodes(label, batch)
        self._nodes_buffer[label] = []

    async def _flush_edges(self, rel_type: str) -> None:
        batch = self._edges_buffer.get(rel_type, [])
        if batch and self.neo4j_sink:
            await self.neo4j_sink.merge_bulk_edges(rel_type, batch)
        self._edges_buffer[rel_type] = []

    async def _flush_all(self) -> None:
        for label in list(self._nodes_buffer.keys()):
            await self._flush_nodes(label)
        for rel_type in list(self._edges_buffer.keys()):
            await self._flush_edges(rel_type)
