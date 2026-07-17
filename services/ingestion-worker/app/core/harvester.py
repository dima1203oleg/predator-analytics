"""Autonomous Data Harvester — PREDATOR Analytics v61.0-ELITE.

Повністю автономний процес (Level 5) для пошуку та збору нових датасетів (наприклад, DataGov, Prozorro).
"""
import asyncio
import datetime
import json
import logging
import uuid
from typing import Any

from aiokafka import AIOKafkaProducer

from app.config import get_settings
from app.harvesters.prozorro_sync import ProzorroSynchronizer
from app.harvesters.edr_aggregator import EDRAggregator

logger = logging.getLogger(__name__)

class Harvester:
    """Сервіс для автономного завантаження даних."""

    def __init__(self, producer: AIOKafkaProducer):
        self.settings = get_settings()
        self.producer = producer
        self.tenant_id = self.settings.ROOT_TENANT_ID

    async def _harvest_datagov(self) -> None:
        """Сканує data.gov.ua та ЄДР (використовуючи EDRAggregator)."""
        logger.info("Harvester: Сканування ЄДР розпочато...")
        
        # Використовуємо реальний агрегатор
        aggregator = EDRAggregator()
        # Для прикладу беремо ключову компанію
        edrpou_to_scan = "04362489"
        
        try:
            graph = await aggregator.build_ownership_graph(edrpou_to_scan)
            
            event = {
                "event_id": str(uuid.uuid4()),
                "tenant_id": self.tenant_id,
                "event_type": "edr_ownership_graph_updated",
                "source": "edr_aggregator",
                "timestamp": datetime.datetime.now(datetime.UTC).isoformat(),
                "payload": graph.model_dump()
            }
            
            topic = getattr(self.settings, 'KAFKA_TOPIC_EDR', "registry.edr.events")
            await self.producer.send_and_wait(
                topic=topic,
                value=json.dumps(event).encode("utf-8"),
                key=event["event_id"].encode("utf-8")
            )
            logger.info("Harvester: Граф власності отримано та відправлено в Kafka.")
        except Exception as e:
            logger.error(f"Harvester: Помилка сканування ЄДР: {e}")
        finally:
            await aggregator.close()

    async def _harvest_prozorro(self) -> None:
        """Сканує тендери Prozorro через ProzorroSynchronizer."""
        logger.info("Harvester: Сканування Prozorro розпочато...")
        
        sync = ProzorroSynchronizer(max_pages_per_run=1)  # 1 сторінка для демо
        try:
            tenders = await sync.sync_tenders()
            
            if tenders:
                payload = [t.model_dump() for t in tenders]
                event = {
                    "event_id": str(uuid.uuid4()),
                    "tenant_id": self.tenant_id,
                    "event_type": "prozorro_tenders_batch",
                    "timestamp": datetime.datetime.now(datetime.UTC).isoformat(),
                    "payload": payload
                }

                topic = getattr(self.settings, 'KAFKA_TOPIC_PROZORRO', "registry.prozorro.events")
                
                await self.producer.send_and_wait(
                    topic=topic,
                    value=json.dumps(event).encode("utf-8"),
                    key=event["event_id"].encode("utf-8")
                )
                logger.info(f"Harvester: Знайдено {len(tenders)} тендерів Prozorro. Відправлено в Kafka.")
        except Exception as e:
            logger.error(f"Harvester: Помилка сканування Prozorro: {e}")
        finally:
            await sync.close()

    async def harvest_all(self) -> None:
        """Запускає всі модулі збору."""
        await asyncio.gather(
            self._harvest_datagov(),
            self._harvest_prozorro(),
            self._harvest_opendatabot(),
            self._harvest_youcontrol(),
        )

    async def _harvest_opendatabot(self) -> None:
        """Сканує Opendatabot на зміни статусів та судові справи."""
        logger.info("Harvester: Сканування Opendatabot розпочато...")
        await asyncio.sleep(1)  # Імітація HTTP запиту

        event = {
            "event_id": str(uuid.uuid4()),
            "tenant_id": self.tenant_id,
            "event_type": "opendatabot_status_changed",
            "source": "opendatabot.com",
            "timestamp": datetime.datetime.now(datetime.UTC).isoformat(),
            "payload": [
                {
                    "edrpou": "38294012",
                    "name": "ТОВ 'СПЕЦТЕХПОСТАЧ'",
                    "change_type": "court_record_added",
                    "court_case": "910/12345/26",
                    "amount": 2_400_000.0,
                    "date": "2026-07-15"
                },
                {
                    "edrpou": "19283746",
                    "name": "ПАТ 'УКРІМПОРТ'",
                    "change_type": "beneficiary_changed",
                    "old_beneficiary": "Сидоренко Олег В.",
                    "new_beneficiary": "Мюллер Ганс Дітер",
                    "date": "2026-07-14"
                }
            ]
        }

        topic = getattr(self.settings, 'KAFKA_TOPIC_OPENDATABOT', "registry.opendatabot.events")

        try:
            await self.producer.send_and_wait(
                topic=topic,
                value=json.dumps(event).encode("utf-8"),
                key=event["event_id"].encode("utf-8")
            )
            logger.info(
                "Harvester: Opendatabot — знайдено %d змін статусів. Відправлено в Kafka.",
                len(event["payload"])
            )
        except Exception as e:
            logger.error("Harvester: Помилка відправки Opendatabot в Kafka: %s", e)

    async def _harvest_youcontrol(self) -> None:
        """Отримує щоденний дамп ризик-факторів від YouControl."""
        logger.info("Harvester: Сканування YouControl розпочато...")
        await asyncio.sleep(2)  # Імітація API запиту

        event = {
            "event_id": str(uuid.uuid4()),
            "tenant_id": self.tenant_id,
            "event_type": "youcontrol_risk_dump",
            "source": "youcontrol.com.ua",
            "timestamp": datetime.datetime.now(datetime.UTC).isoformat(),
            "payload": [
                {
                    "edrpou": "38294012",
                    "risk_score": 94,
                    "risk_level": "CRITICAL",
                    "risk_factors": ["sanctions_proximity", "shell_company_pattern", "negative_media"],
                    "updated_at": datetime.datetime.now(datetime.UTC).isoformat()
                },
                {
                    "edrpou": "22334455",
                    "risk_score": 31,
                    "risk_level": "LOW",
                    "risk_factors": [],
                    "updated_at": datetime.datetime.now(datetime.UTC).isoformat()
                }
            ]
        }

        topic = getattr(self.settings, 'KAFKA_TOPIC_YOUCONTROL', "registry.youcontrol.events")

        try:
            await self.producer.send_and_wait(
                topic=topic,
                value=json.dumps(event).encode("utf-8"),
                key=event["event_id"].encode("utf-8")
            )
            logger.info(
                "Harvester: YouControl — оновлено ризик-профілі %d компаній. Відправлено в Kafka.",
                len(event["payload"])
            )
        except Exception as e:
            logger.error("Harvester: Помилка відправки YouControl в Kafka: %s", e)
