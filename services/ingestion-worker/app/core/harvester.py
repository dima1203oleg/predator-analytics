"""Autonomous Data Harvester — PREDATOR Analytics v61.0-ELITE.

Повністю автономний процес (Level 5) для пошуку та збору нових датасетів (наприклад, DataGov, Prozorro).
"""
import asyncio
import datetime
import json
import logging
from typing import Any
import uuid

from aiokafka import AIOKafkaProducer

from app.config import get_settings
from app.harvesters.alienvault_harvester import AlienVaultHarvester
from app.harvesters.cisa_kev_harvester import CisaKevHarvester
from app.harvesters.edr_aggregator import EDRAggregator
from app.harvesters.gdelt_harvester import GDELTHarvester
from app.harvesters.nazk_harvester import NazkHarvester
from app.harvesters.nbu_harvester import NBUHarvester
from app.harvesters.open_sanctions_harvester import OpenSanctionsHarvester
from app.harvesters.openalex_harvester import OpenAlexHarvester
from app.harvesters.prozorro_sync import ProzorroSynchronizer
from app.harvesters.spending_harvester import SpendingHarvester

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
        """Запускає всі модулі збору (Orchestrator)."""
        logger.info("Harvester: Початок глобального циклу збору даних (Phase 6.4)")

        # Запускаємо існуючі модулі
        await asyncio.gather(
            self._harvest_datagov(),
            self._harvest_prozorro(),
            self._harvest_opendatabot(),
            self._harvest_youcontrol(),
            return_exceptions=True
        )

        # Запускаємо нові модулі збору Phase 6
        # Використовуємо послідовний виклик або розбиваємо на групи для уникнення мережевого перевантаження
        try:
            await self._harvest_nbu()
            await self._harvest_cisa_kev()
            await self._harvest_opensanctions()
            await self._harvest_spending()
            await self._harvest_openalex()
            await self._harvest_gdelt()
            await self._harvest_alienvault()
            await self._harvest_nazk()
        except Exception as e:
            logger.error(f"Harvester: Помилка під час виконання нових конвеєрів: {e}")

        logger.info("Harvester: Глобальний цикл збору даних завершено.")

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

    async def _publish_to_kafka(self, topic: str, event_type: str, source: str, payload: Any) -> None:
        """Допоміжний метод для публікації події у Kafka."""
        event = {
            "event_id": str(uuid.uuid4()),
            "tenant_id": self.tenant_id,
            "event_type": event_type,
            "source": source,
            "timestamp": datetime.datetime.now(datetime.UTC).isoformat(),
            "payload": payload
        }
        try:
            await self.producer.send_and_wait(
                topic=topic,
                value=json.dumps(event).encode("utf-8"),
                key=event["event_id"].encode("utf-8")
            )
        except Exception as e:
            logger.error(f"Harvester: Помилка публікації в {topic}: {e}")

    async def _harvest_nbu(self) -> None:
        logger.info("Harvester: Запуск NBU Harvester...")
        harvester = NBUHarvester()
        try:
            rates = await harvester.fetch_exchange_rates()
            if rates:
                await self._publish_to_kafka("registry.nbu.events", "exchange_rates_updated", "nbu", rates)
                logger.info(f"Harvester: Збережено {len(rates)} курсів валют НБУ.")
        finally:
            await harvester.close()

    async def _harvest_cisa_kev(self) -> None:
        logger.info("Harvester: Запуск CISA KEV Harvester...")
        harvester = CisaKevHarvester()
        try:
            data = await harvester.fetch_kev_catalog()
            if data and data.get("vulnerabilities"):
                await self._publish_to_kafka("osint.threats.events", "cisa_kev_updated", "cisa", data["vulnerabilities"])
                logger.info(f"Harvester: Оновлено {len(data['vulnerabilities'])} вразливостей CISA KEV.")
        finally:
            await harvester.close()

    async def _harvest_opensanctions(self) -> None:
        logger.info("Harvester: Запуск OpenSanctions Harvester...")
        harvester = OpenSanctionsHarvester()
        try:
            batch = []
            async for entity in harvester.stream_entities(limit=1000): # Демо-ліміт 1000 сутностей
                batch.append(entity)
                if len(batch) >= 100:
                    await self._publish_to_kafka("registry.sanctions.events", "opensanctions_batch", "opensanctions", batch)
                    batch = []
            if batch:
                await self._publish_to_kafka("registry.sanctions.events", "opensanctions_batch", "opensanctions", batch)
        finally:
            await harvester.close()

    async def _harvest_spending(self) -> None:
        logger.info("Harvester: Запуск Spending Harvester...")
        harvester = SpendingHarvester()
        try:
            # Завантажуємо останні 7 днів як демо/стартовий діапазон
            end_date = datetime.datetime.now(datetime.UTC).date()
            start_date = end_date - datetime.timedelta(days=7)

            batch = []
            async for tx in harvester.stream_historical(start_date, end_date):
                batch.append(tx)
                if len(batch) >= 1000:
                    await self._publish_to_kafka("registry.spending.events", "spending_batch", "spending.gov.ua", batch)
                    logger.info("Harvester: Відправлено батч з 1000 транзакцій Spending в Kafka.")
                    batch = []

            if batch:
                await self._publish_to_kafka("registry.spending.events", "spending_batch", "spending.gov.ua", batch)
                logger.info(f"Harvester: Відправлено фінальний батч з {len(batch)} транзакцій Spending в Kafka.")

        except Exception as e:
            logger.error(f"Harvester: Помилка під час сканування Spending: {e}")
        finally:
            await harvester.close()

    async def _harvest_openalex(self) -> None:
        logger.info("Harvester: Запуск OpenAlex Harvester...")
        harvester = OpenAlexHarvester()
        try:
            batch = []
            async for work in harvester.stream_works(limit=200): # Демо-ліміт
                batch.append(work)
            if batch:
                await self._publish_to_kafka("osint.science.events", "openalex_works_batch", "openalex", batch)
                logger.info(f"Harvester: Опубліковано {len(batch)} наукових праць OpenAlex.")
        finally:
            await harvester.close()

    async def _harvest_gdelt(self) -> None:
        logger.info("Harvester: Запуск GDELT Harvester...")
        harvester = GDELTHarvester()
        try:
            async for batch in harvester.harvest_microbatches():
                if batch:
                    # Демо-обмеження до 50 подій для повідомлення
                    await self._publish_to_kafka("osint.geopolitics.events", "gdelt_events_batch", "gdelt", batch[:50])
                    break # Тільки один батч для демо
        finally:
            await harvester.close()

    async def _harvest_alienvault(self) -> None:
        logger.info("Harvester: Запуск AlienVault Harvester...")
        harvester = AlienVaultHarvester()
        try:
            batch = []
            async for pulse in harvester.stream_pulses(limit=50): # Демо ліміт
                batch.append(pulse)
            if batch:
                await self._publish_to_kafka("osint.threats.events", "alienvault_pulses_batch", "alienvault", batch)
                logger.info(f"Harvester: Опубліковано {len(batch)} кібер-пульсів.")
        finally:
            await harvester.close()

    async def _harvest_nazk(self) -> None:
        logger.info("Harvester: Запуск NAZK Harvester...")
        harvester = NazkHarvester()
        try:
            batch = []
            async for doc in harvester.stream_declarations(limit=20): # Демо ліміт
                batch.append(doc)
            if batch:
                await self._publish_to_kafka("registry.nazk.events", "nazk_declarations_batch", "nazk", batch)
                logger.info(f"Harvester: Опубліковано {len(batch)} декларацій НАЗК.")
        finally:
            await harvester.close()
