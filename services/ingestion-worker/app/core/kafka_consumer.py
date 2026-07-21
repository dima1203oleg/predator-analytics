"""Kafka Consumer — Асинхронний споживач подій для графової проекції.

Цей модуль відповідає за прослуховування топіків Kafka (куди харвестери
публікують сирі або відфільтровані дані), десеріалізацію подій та їх
динамічну маршрутизацію до модуля `GraphProjector` для збереження у Neo4j.
"""

import asyncio
import json
import logging
import os
from typing import Any

from aiokafka import AIOKafkaConsumer

from app.config import get_settings
from app.core.graph_projector import GraphProjector
from app.pipelines.edr_pipeline import EDRPipeline

logger = logging.getLogger("ingestion.consumer")


class CoreConsumer:
    """Центральний споживач даних з Kafka."""

    def __init__(self) -> None:
        self.settings = get_settings()
        self.bootstrap_servers = getattr(
            self.settings, "KAFKA_BOOTSTRAP_SERVERS", "localhost:9092"
        )
        self.group_id = "ingestion_graph_projector_group"
        
        self.dossier_aggregator = None # Lazy initialization

        # Топіки, створені під час Phase 6
        self.topics = [
            "registry.nbu.events",
            "osint.threats.events",
            "registry.sanctions.events",
            "osint.science.events",
            "osint.geopolitics.events",
            "registry.nazk.events",
            "osint.scan.requested",
            "predator.factory.opensanctions.start",
            "predator.factory.prozorro.start",
            "predator.factory.edr.start",
            # Старі топіки
            getattr(self.settings, "KAFKA_TOPIC_EDR", "registry.edr.events"),
            getattr(self.settings, "KAFKA_TOPIC_PROZORRO", "registry.prozorro.events"),
        ]

        self.consumer = AIOKafkaConsumer(
            *self.topics,
            bootstrap_servers=self.bootstrap_servers,
            group_id=self.group_id,
            auto_offset_reset="earliest",
            value_deserializer=lambda m: json.loads(m.decode("utf-8")),
        )

        self.graph_projector = GraphProjector()

    async def start(self) -> None:
        """Запускає цикл споживання подій."""
        logger.info(
            f"CoreConsumer: Підключення до Kafka ({self.bootstrap_servers}). Топіки: {self.topics}"
        )
        await self.consumer.start()

        try:
            logger.info("CoreConsumer: Успішно підключено. Очікування повідомлень...")
            async for msg in self.consumer:
                topic = msg.topic
                event: dict[str, Any] = msg.value

                logger.debug(f"CoreConsumer: Отримано подію {event.get('event_type')} з {topic}")

                if topic == "osint.scan.requested":
                    asyncio.create_task(self._handle_osint_scan(event))
                    continue
                    
                if topic == "predator.factory.opensanctions.start":
                    asyncio.create_task(self._handle_opensanctions_start(event))
                    continue

                if topic == "predator.factory.prozorro.start" or topic == "predator.factory.edr.start":
                    asyncio.create_task(self._handle_pipeline_start(topic, event))
                    continue

                # Делегування обробки події в Graph Projector
                try:
                    await self.graph_projector.process_event(topic, event)
                except Exception as e:
                    logger.error(
                        f"CoreConsumer: Помилка обробки події {event.get('event_id')}: {e}"
                    )
                    # В реальній системі тут буде відправка в Dead Letter Queue (DLQ)

        finally:
            logger.info("CoreConsumer: Зупинка споживача...")
            await self.consumer.stop()

    async def _handle_osint_scan(self, event: dict[str, Any]) -> None:
        """Обробка запиту на генерацію досьє."""
        job_id = event.get("job_id")
        if not job_id:
            logger.error("CoreConsumer: OSINT Scan не має job_id")
            return
            
        try:
            import redis.asyncio as redis
            from app.osint.dossier_aggregator import DossierAggregator
            from app.osint.collectors.base import DossierQuery, EntityType, Classification
            import time
            import json
            
            if self.dossier_aggregator is None:
                self.dossier_aggregator = DossierAggregator()
            
            redis_url = getattr(self.settings, "REDIS_URL", "redis://localhost:6379/0")
            # Override for local dev if needed
            if "redis:" in redis_url and not os.environ.get("DOCKER_ENV"):
                redis_url = "redis://localhost:6379/0"
                
            r = redis.from_url(redis_url)
            
            await r.set(f"osint_scan:{job_id}", json.dumps({
                "status": "processing",
                "job_id": job_id
            }), ex=3600)
            
            levels = [Classification(lvl) for lvl in event.get("classification_levels", ["WHITE", "GREY"])]
            
            query = DossierQuery(
                entity_type=EntityType(event.get("entity_type", "person")),
                identifier=event.get("identifier"),
                name=event.get("name"),
                email=event.get("email"),
                phone=event.get("phone"),
                edrpou=event.get("edrpou"),
                rnokpp=event.get("rnokpp"),
                address=event.get("address"),
                classification_levels=levels,
                collectors_override=event.get("collectors_override")
            )
            
            dossier = await self.dossier_aggregator.compile_dossier(query)
            
            await r.set(f"osint_scan:{job_id}", json.dumps({
                "status": "success",
                "job_id": job_id,
                "risk_score": dossier.risk_assessment.get("composite_score", 0),
                "data": dossier.model_dump()
            }), ex=86400)
            
            logger.info(f"CoreConsumer: OSINT Scan {job_id} завершено успішно.")
        except Exception as e:
            logger.error(f"CoreConsumer: Помилка обробки OSINT Scan {job_id}: {e}", exc_info=True)
            try:
                import redis.asyncio as redis
                import json
                redis_url = getattr(self.settings, "REDIS_URL", "redis://localhost:6379/0")
                if "redis:" in redis_url and not os.environ.get("DOCKER_ENV"):
                    redis_url = "redis://localhost:6379/0"
                r = redis.from_url(redis_url)
                await r.set(f"osint_scan:{job_id}", json.dumps({
                    "status": "error",
                    "job_id": job_id,
                    "error": str(e)
                }), ex=3600)
            except Exception as inner_e:
                logger.error(f"Failed to update redis on error: {inner_e}")

    async def _handle_opensanctions_start(self, event: dict[str, Any]) -> None:
        """Обробка запиту на запуск OpenSanctions Pipeline."""
        logger.info("CoreConsumer: Запуск OpenSanctions Pipeline")
        try:
            from app.pipelines.opensanctions_pipeline import OpenSanctionsPipeline
            from app.sinks.neo4j_sink import Neo4jSink
            
            neo4j_sink = Neo4jSink()
            pipeline = OpenSanctionsPipeline(neo4j_sink=neo4j_sink)
            
            await pipeline.process(event)
            await neo4j_sink.close()
            logger.info("CoreConsumer: OpenSanctions Pipeline завершив роботу.")
        except Exception as e:
            logger.error(f"CoreConsumer: Помилка OpenSanctions Pipeline: {e}", exc_info=True)

    async def _handle_pipeline_start(self, topic: str, event: dict[str, Any]) -> None:
        """Обробка запиту на запуск Pipeline."""
        logger.info(f"CoreConsumer: Запуск Pipeline для {topic}")
        try:
            from app.pipelines.prozorro_pipeline import ProzorroPipeline
            from app.sinks.neo4j_sink import Neo4jSink
            
            neo4j_sink = Neo4jSink()
            if topic == "predator.factory.prozorro.start":
                pipeline = ProzorroPipeline(neo4j_sink=neo4j_sink)
            elif topic == "predator.factory.edr.start":
                pipeline = EDRPipeline(neo4j_sink=neo4j_sink)
            else:
                await neo4j_sink.close()
                return

            await pipeline.process(event)
            await neo4j_sink.close()
            logger.info(f"CoreConsumer: Pipeline {topic} завершив роботу.")
        except Exception as e:
            logger.error(f"CoreConsumer: Помилка Pipeline {topic}: {e}", exc_info=True)
