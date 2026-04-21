"""Graph Synchronization Service — PREDATOR Analytics (T2.2).

Відповідає за асинхронну синхронізацію збагачених даних у Neo4j.
Споживає події з топіка ENRICHMENT і створює/оновлює вузли.
"""
import asyncio
import json
import logging
from typing import Any

from aiokafka import AIOKafkaConsumer

from app.config import get_settings
from app.graph_db import graph_db

logger = logging.getLogger("graph_service.sync")
settings = get_settings()

class GraphSyncWorker:
    """Воркер для фонової синхронізації з Kafka до Neo4j."""

    def __init__(self):
        self.topic = getattr(settings, "KAFKA_TOPIC_ENRICHMENT", "tenant.default.enrichment.events")
        self.brokers = settings.KAFKA_BROKERS
        self.group_id = "predator-graph-sync-group"
        self.consumer: AIOKafkaConsumer | None = None
        self._task: asyncio.Task[Any] | None = None

    async def start(self):
        """Запуск споживача."""
        self.consumer = AIOKafkaConsumer(
            self.topic,
            bootstrap_servers=self.brokers,
            group_id=self.group_id,
            auto_offset_reset="earliest",
            enable_auto_commit=False,
        )
        await self.consumer.start()
        logger.info(f"GraphSyncWorker started on topic: {self.topic}")
        self._task = asyncio.create_task(self._consume_loop())

    async def stop(self):
        """Зупинка споживача."""
        if self._task:
            self._task.cancel()
        if self.consumer:
            await self.consumer.stop()
        logger.info("GraphSyncWorker stopped.")

    async def _consume_loop(self):
        """Головний цикл отримання повідомлень."""
        if not self.consumer:
            return
            
        try:
            async for msg in self.consumer:
                if not msg.value:
                    continue
                try:
                    payload = json.loads(msg.value.decode("utf-8"))
                    await self._sync_to_neo4j(payload)
                    await self.consumer.commit()
                except Exception as e:
                    logger.error(f"Failed to sync message to Neo4j: {e}")
                    # В реальності тут би відправили в DLQ (T1.2)
        except asyncio.CancelledError:
            pass

    async def _sync_to_neo4j(self, entity: dict[str, Any]):
        """Виконує Cypher MERGE для запису в Neo4j."""
        ueid = entity.get("ueid")
        edrpou = entity.get("edrpou")
        name = entity.get("назва") or entity.get("name")
        risk_score = entity.get("ризик_скор", 0.0)
        tenant_id = entity.get("tenant_id", "default")
        
        if not ueid:
            logger.warning("No UEID provided in message, skipping graph sync.")
            return

        # 1. Company Node
        company_query = """
        MERGE (c:Company {tenant_id: $tenant_id, ueid: $ueid})
        SET c.name = $name,
            c.edrpou = $edrpou,
            c.risk_score = $risk_score,
            c.last_updated = timestamp()
        """
        await graph_db.run_query(company_query, {
            "tenant_id": tenant_id,
            "ueid": ueid,
            "name": name,
            "edrpou": edrpou,
            "risk_score": risk_score
        })
        
        # 2. Directors / Beneficiaries connections
        director = entity.get("director")
        if director:
            director_query = """
            MATCH (c:Company {tenant_id: $tenant_id, ueid: $ueid})
            MERGE (p:Person {tenant_id: $tenant_id, name: $director_name})
            MERGE (p)-[r:MANAGED_BY]->(c)
            SET r.since = timestamp()
            """
            await graph_db.run_query(director_query, {
                "tenant_id": tenant_id,
                "ueid": ueid,
                "director_name": director
            })
            
        logger.debug(f"Synced UEID {ueid} to Neo4j graph.")
