"""Ingestion Worker Main Logic — PREDATOR Analytics v61.0-ELITE Ironclad.

Слухає Kafka події та запускає пайплайни обробки даних:
1. File Ingestion Pipeline — обробка завантажених файлів з MinIO
2. OSINT Enrichment — збагачення компаній через зовнішні реєстри
"""
import asyncio
import contextlib
from datetime import UTC, datetime
import hashlib
import json
import signal
from typing import Any
import uuid

from aiokafka import AIOKafkaConsumer, AIOKafkaProducer
from pydantic import ValidationError

from app.config import get_settings
from app.core.neo4j_auto_sync import get_neo4j_auto_sync
from app.core.nlp_pipeline import get_nlp_pipeline
from app.core.pattern_discovery import get_pattern_discovery_engine
from app.core.schema_evolution import get_schema_evolution_engine
from app.fusion_engine import ДвигунЗлиттяДаних
from app.health import set_health_status, start_health_server, stop_health_server
from app.pipelines.automl_pipeline import AutoMLPipeline
from app.pipelines.customs import CustomsPipeline
from app.pipelines.file_ingestion import FileIngestionPipeline
from app.pipelines.omniverse_pipeline import OmniversePipeline
from app.pipelines.ua_registry import UARegistryPipeline
from app.registries.ua_registries import УкраїнськийРеєстр
from app.services.omniverse_watchdog import OmniverseWatchdog
from app.sinks.postgres_sink import PostgresSink
from predator_common.logging import get_logger

logger = get_logger("ingestion_worker")
settings = get_settings()

# Канонічні назви топіків (HR-17: tenant.{id}.category.name)
TOPIC_RAW = settings.KAFKA_TOPIC_INGESTION_RAW
TOPIC_ENRICHED = settings.KAFKA_TOPIC_ENRICHMENT
TOPIC_OMNIVERSE = settings.KAFKA_TOPIC_OMNIVERSE_INGESTION


async def process_file_upload(
    msg_value: dict[str, Any],
    producer: AIOKafkaProducer,
    postgres_sink: PostgresSink,
) -> None:
    """Обробка завантаженого файлу з MinIO.

    Очікуваний формат повідомлення (RawFileUpload):
    - job_id: str
    - tenant_id: str
    - user_id: str
    - file_name: str
    - file_size_bytes: int
    - file_content_hash: str
    - upload_timestamp: int
    - s3_bucket_path: str
    """
    job_id = msg_value.get("job_id")
    tenant_id = msg_value.get("tenant_id")
    user_id = msg_value.get("user_id")
    file_name = msg_value.get("file_name")
    s3_path = msg_value.get("s3_bucket_path")

    if not all([job_id, tenant_id, s3_path]):
        logger.warning(
            "ingestion_worker.skip_file",
            reason="Відсутні обов'язкові поля",
            job_id=job_id,
        )
        return

    logger.info(
        "ingestion_worker.file_upload_start",
        job_id=job_id,
        file_name=file_name,
        s3_path=s3_path,
    )

    try:
        # Оновлюємо статус job на "processing"
        await postgres_sink.update_job_progress(
            job_id=job_id,
            status="processing",
            progress=0,
            records_processed=0,
            records_errors=0,
        )

        # Callback для оновлення прогресу
        async def progress_callback(progress: dict[str, Any]) -> None:
            stage = progress.get("stage", "processing")
            status = "processing"

            if stage == "indexing":
                status = "indexing"
            elif stage == "vectorizing":
                status = "vectorizing"

            await postgres_sink.update_job_progress(
                job_id=job_id,
                status=status,
                progress=progress.get("progress_pct", 0),
                records_processed=progress.get("processed_rows", 0),
                records_errors=progress.get("quarantined_rows", 0),
                metadata_updates={"warnings": progress.get("warning_messages", [])},
            )

        # Запуск пайплайну інгестії файлу
        pipeline = FileIngestionPipeline(
            job_id=job_id,
            tenant_id=tenant_id,
            user_id=user_id,
            file_name=file_name,
            s3_path=s3_path,
            progress_callback=progress_callback,
        )

        result = await pipeline.run()

        # Оновлюємо статус job на "completed"
        await postgres_sink.update_job_progress(
            job_id=job_id,
            status="completed",
            progress=100,
            records_processed=result.get("valid_rows", 0),
            records_errors=result.get("quarantined_rows", 0),
        )

        # Публікуємо подію завершення інгестії для аналітичних шарів
        enriched_event = {
            "job_id": job_id,
            "tenant_id": tenant_id,
            "dataset_hash": result.get("dataset_hash"),
            "ingestion_timestamp": int(datetime.now(UTC).timestamp() * 1000),
            "record_count": result.get("valid_rows", 0),
            "status": "completed",
        }

        await producer.send_and_wait(
            topic=TOPIC_ENRICHED,
            value=json.dumps(enriched_event).encode("utf-8"),
            key=job_id.encode("utf-8"),
        )

        logger.info(
            "ingestion_worker.file_upload_success",
            job_id=job_id,
            total_rows=result.get("total_rows"),
            valid_rows=result.get("valid_rows"),
            quarantined=result.get("quarantined_rows"),
            duration=result.get("duration_seconds"),
        )

    except Exception as e:
        logger.error(
            "ingestion_worker.file_upload_error",
            job_id=job_id,
            error=str(e),
            exc_info=True,
        )
        # Оновлюємо статус job на "failed"
        await postgres_sink.update_job_progress(
            job_id=job_id,
            status="failed",
            progress=0,
            records_processed=0,
            records_errors=0,
        )

async def process_omniverse_ingestion(
    msg_value: dict[str, Any],
    producer: AIOKafkaProducer,
    postgres_sink: PostgresSink,
) -> None:
    """Універсальна обробка OMNIVERSE."""
    job_id = msg_value.get("job_id")
    tenant_id = msg_value.get("tenant_id")
    file_name = msg_value.get("file_name")
    s3_path = msg_value.get("s3_path")
    schema = msg_value.get("schema_definition")

    if not all([job_id, tenant_id, s3_path, schema]):
        logger.warning("omniverse.skip", job_id=job_id, reason="Missing fields")
        return

    logger.info("omniverse.start", job_id=job_id, file=file_name)

    try:
        await postgres_sink.update_job_progress(job_id=job_id, status="processing", progress=10)

        pipeline = OmniversePipeline(
            job_id=job_id,
            tenant_id=tenant_id,
            file_name=file_name,
            s3_path=s3_path,
            schema_definition=schema
        )

        result = await pipeline.run()

        await postgres_sink.update_job_progress(
            job_id=job_id,
            status="completed",
            progress=100,
            records_processed=result.get("total_rows", 0)
        )

        logger.info("omniverse.success", job_id=job_id, rows=result.get("total_rows"))

    except Exception as e:
        logger.error("omniverse.error", job_id=job_id, error=str(e), exc_info=True)
        await postgres_sink.update_job_progress(job_id=job_id, status="failed")


async def process_osint_enrichment(
    msg_value: dict[str, Any],
    fusion_engine: ДвигунЗлиттяДаних,
    producer: AIOKafkaProducer,
) -> None:
    """Обробка OSINT збагачення для компанії."""
    edrpou = msg_value.get("edrpou")
    ueid = msg_value.get("ueid", f"ueid_{edrpou}")

    if not edrpou:
        logger.warning("ingestion_worker.skip_osint", reason="Відсутній ЄДРПОУ")
        return

    logger.info("ingestion_worker.osint_start", edrpou=edrpou)

    try:
        # Запуск Data Fusion Engine
        enriched_data = await fusion_engine.збагатити_компанію(edrpou=edrpou, ueid=ueid)

        # Публікація результату в топік збагачених даних
        await producer.send_and_wait(
            topic=TOPIC_ENRICHED,
            value=enriched_data.model_dump_json().encode("utf-8"),
        )
        logger.info("ingestion_worker.osint_success", edrpou=edrpou)

    except Exception as e:
        logger.error("ingestion_worker.osint_error", error=str(e), exc_info=True)


async def process_automl_dataset(
    msg_value: dict[str, Any],
    producer: AIOKafkaProducer,
    postgres_sink: PostgresSink,
) -> None:
    """Обробка створення датасетів та запуск AutoML."""
    file_id = msg_value.get("job_id") or msg_value.get("file_id")
    if not file_id:
        logger.warning("ingestion_worker.skip_automl", reason="Відсутній file_id/job_id")
        return

    logger.info("ingestion_worker.automl_start", file_id=file_id)
    try:
        pipeline = AutoMLPipeline()
        result = await pipeline.process_dataset(file_id=file_id, data=msg_value)
        logger.info("ingestion_worker.automl_success", file_id=file_id, strategy=result.get("strategy"))
    except Exception as e:
        logger.error("ingestion_worker.automl_error", error=str(e), exc_info=True)


async def process_customs_declaration(
    msg_value: dict[str, Any],
    producer: AIOKafkaProducer,
    postgres_sink: PostgresSink,
) -> None:
    """Обробка потокових митних декларацій."""
    tenant_id = msg_value.get("tenant_id", settings.ROOT_TENANT_ID)
    data = msg_value.get("customs_declaration")

    if not data:
        logger.warning("ingestion_worker.skip_customs", reason="Відсутні дані customs_declaration")
        return

    logger.info("ingestion_worker.customs_start", tenant_id=tenant_id)
    try:
        pipeline = CustomsPipeline(tenant_id=tenant_id)
        # Передаємо list, оскільки pipeline очікує список або CSV
        data_to_process = [data] if isinstance(data, dict) else data
        result = await pipeline.run(data_to_process)

        logger.info("ingestion_worker.customs_success", processed=result.get("processed_count", 0))

        # Публікуємо подію в TOPIC_ENRICHED
        event_payload = {
            "type": "customs_declaration_processed",
            "tenant_id": tenant_id,
            "processed_count": result.get("processed_count", 0),
            "timestamp": int(datetime.now(UTC).timestamp() * 1000)
        }
        await producer.send_and_wait(
            topic=TOPIC_ENRICHED,
            value=json.dumps(event_payload).encode("utf-8"),
        )
    except Exception as e:
        logger.error("ingestion_worker.customs_error", error=str(e), exc_info=True)


async def process_message(
    msg_value: dict[str, Any],
    fusion_engine: ДвигунЗлиттяДаних,
    producer: AIOKafkaProducer,
    postgres_sink: PostgresSink,
    topic: str = "",
) -> None:
    """Маршрутизація повідомлень до відповідних обробників з ідемпотентністю."""
    # 1. Генерація або отримання event_id (TZ §5.3)
    event_id_str = msg_value.get("event_id")
    if not event_id_str:
        if "job_id" in msg_value:
            event_id_str = msg_value["job_id"]
        else:
            payload_hash = hashlib.md5(json.dumps(msg_value, sort_keys=True).encode()).hexdigest()  # noqa: S324
            event_id_str = str(uuid.UUID(payload_hash))

    # Перевірка через таблицю processed_events
    if await postgres_sink.is_event_processed(event_id_str):
        logger.info("ingestion_worker.event_already_processed", event_id=event_id_str)
        return

    tenant_id = msg_value.get("tenant_id", settings.ROOT_TENANT_ID)
    source = "file_ingestion" if "s3_bucket_path" in msg_value else "osint_enrichment"

    try:
        # Визначаємо тип повідомлення
        if "schema_definition" in msg_value:
            # Це OMNIVERSE Dynamic Ingestion
            await process_omniverse_ingestion(msg_value, producer, postgres_sink)
        elif "s3_bucket_path" in msg_value:
            # Це RawFileUpload — завантажений файл
            await process_file_upload(msg_value, producer, postgres_sink)
        elif "edrpou" in msg_value:
            # Це запит на OSINT збагачення
            await process_osint_enrichment(msg_value, fusion_engine, producer)
        elif "automl_request" in msg_value:
            # Запит на AutoML та створення датасетів
            await process_automl_dataset(msg_value, producer, postgres_sink)
        elif "customs_declaration" in msg_value:
            # Інгестія потокових митних декларацій
            await process_customs_declaration(msg_value, producer, postgres_sink)
        elif topic in [settings.KAFKA_TOPIC_PROZORRO, settings.KAFKA_TOPIC_EDR]:
            # UA Registry Gateway OSINT події
            registry_pipeline = UARegistryPipeline(postgres_sink)
            await registry_pipeline.process_event(topic, msg_value)
        else:
            logger.warning(
                "ingestion_worker.unknown_message_type",
                keys=list(msg_value.keys()),
                topic=topic,
            )
            return

        # Позначаємо як успішно оброблено
        await postgres_sink.mark_event_processed(event_id_str, tenant_id, source, "SUCCESS")

    except ValidationError as e:
        # T1.4 - Відправка в quarantine topic при Schema Drift
        await postgres_sink.mark_event_processed(event_id_str, tenant_id, source, "QUARANTINE")
        quarantine_topic = getattr(settings, 'KAFKA_TOPIC_QUARANTINE', f"tenant.{tenant_id}.schema.quarantine")

        quarantine_payload = {
            "event_id": event_id_str,
            "original_payload": msg_value,
            "error_type": "SchemaDrift",
            "validation_errors": str(e),
            "timestamp": int(datetime.now(UTC).timestamp() * 1000)
        }

        await producer.send_and_wait(
            quarantine_topic,
            json.dumps(quarantine_payload).encode("utf-8"),
            key=event_id_str.encode("utf-8")
        )
        logger.error(f"Schema Drift for event {event_id_str}. Sent to quarantine: {quarantine_topic}")

    except Exception as e:
        # Відправка в DLQ при системних помилках
        await postgres_sink.mark_event_processed(event_id_str, tenant_id, source, "DLQ")
        dlq_topic = getattr(settings, 'KAFKA_TOPIC_DLQ', f"tenant.{tenant_id}.system.dlq")

        dlq_payload = {
            "event_id": event_id_str,
            "original_payload": msg_value,
            "error_message": str(e),
            "timestamp": int(datetime.now(UTC).timestamp() * 1000)
        }

        await producer.send_and_wait(
            dlq_topic,
            json.dumps(dlq_payload).encode("utf-8"),
            key=event_id_str.encode("utf-8")
        )
        logger.error(f"Error processing event {event_id_str}: {e}. Sent to DLQ: {dlq_topic}")


async def consume() -> None:
    """Головний цикл споживання повідомлень з Kafka."""
    # Ініціалізація залежностей
    ua_registry = УкраїнськийРеєстр()
    fusion_engine = ДвигунЗлиттяДаних(ua_registry)
    postgres_sink = PostgresSink()

    # Перевірка підключення до PostgreSQL
    try:
        from sqlalchemy import text
        async with postgres_sink.async_session() as session:
            await session.execute(text("SELECT 1"))
        set_health_status("postgres_connected", True)
        logger.info("PostgreSQL connected")
    except Exception as e:
        logger.error(f"PostgreSQL connection failed: {e}")
        set_health_status("postgres_connected", False)

    # Перевірка доступності Kafka — якщо недоступна, працюємо в standby режимі
    try:
        consumer = AIOKafkaConsumer(
            TOPIC_RAW,
            TOPIC_OMNIVERSE,
            settings.KAFKA_TOPIC_PROZORRO,
            settings.KAFKA_TOPIC_EDR,
            bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
            group_id="predator-ingestion-group",
            auto_offset_reset="earliest",
            value_deserializer=lambda m: json.loads(m.decode("utf-8")) if m else {},
        )
        producer = AIOKafkaProducer(
            bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
        )
        await consumer.start()
        await producer.start()
        set_health_status("kafka_connected", True)
        logger.info("ingestion_worker.started", topic=TOPIC_RAW)
    except Exception as e:
        logger.warning(f"Kafka недоступна — ingestion worker у standby режимі: {e}")
        set_health_status("kafka_connected", False)
        # Не завершуємося — працюємо в standby режимі
        while True:
            await asyncio.sleep(60)

    background_tasks: set[asyncio.Task[Any]] = set()

    try:
        async for msg in consumer:
            logger.info(
                "ingestion_worker.msg_received",
                partition=msg.partition,
                offset=msg.offset,
            )
            if msg.value:
                # Асинхронна обробка події без блокування консьюмера
                task = asyncio.create_task(
                    process_message(msg.value, fusion_engine, producer, postgres_sink, msg.topic)
                )
                background_tasks.add(task)
                task.add_done_callback(background_tasks.discard)
    finally:
        # Чекаємо завершення всіх фонових задач
        if background_tasks:
            await asyncio.gather(*background_tasks, return_exceptions=True)

        await consumer.stop()
        await producer.stop()
        await ua_registry.закрити()
        await postgres_sink.close()


async def autonomous_schema_synthesis_loop() -> None:
    """Фоновий цикл для Autonomous Schema Synthesis.
    
    Запускає Pattern Discovery кожні 30 хвилин для виявлення нових патернів
    та автоматичної еволюції схеми Neo4j.
    """
    logger.info("ASS: Autonomous Schema Synthesis loop запущено")

    # Ініціалізація модулів
    nlp_pipeline = await get_nlp_pipeline()
    pattern_engine = await get_pattern_discovery_engine()
    schema_engine = await get_schema_evolution_engine()
    sync = get_neo4j_auto_sync()

    while True:
        try:
            logger.info("ASS: Запуск Pattern Discovery")

            # Виявлення нових патернів
            patterns = await pattern_engine.discover_new_patterns(
                sample_size=1000,
                monte_carlo_iterations=100
            )

            if patterns:
                logger.info(f"ASS: Виявлено {len(patterns)} нових патернів")

                # Еволюція схеми
                update = await schema_engine.evolve_schema(patterns)

                if update.status.value == "APPROVED":
                    logger.info(f"ASS: Схема оновлена: {update.update_id}")

                    # Синхронізація з Neo4j
                    sync_result = await sync.apply_schema_update(update)

                    if sync_result.status.value == "COMPLETED":
                        logger.info(
                            f"ASS: Синхронізація успішна: "
                            f"{sync_result.relationships_created} нових зв'язків"
                        )
                    else:
                        logger.warning(f"ASS: Синхронізація не вдалася: {sync_result.error_message}")
            else:
                logger.info("ASS: Нових патернів не виявлено")

            # Чекаємо 30 хвилин перед наступним запуском
            await asyncio.sleep(1800)

        except Exception as e:
            logger.exception(f"ASS: Помилка в циклі Pattern Discovery: {e}")
            # Чекаємо 5 хвилин перед retry
            await asyncio.sleep(300)


async def main() -> None:
    """Точка входу воркера."""
    loop = asyncio.get_running_loop()

    # Запускаємо health check сервер
    health_runner = await start_health_server(port=9100)

    # Graceful shutdown
    stop_event = asyncio.Event()
    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, stop_event.set)

    consumer_task = asyncio.create_task(consume())

    # Запускаємо OMNIVERSE Watchdog
    watchdog = OmniverseWatchdog(interval_seconds=300)
    watchdog_task = asyncio.create_task(watchdog.start())

    # Запускаємо Autonomous Schema Synthesis loop
    ass_task = asyncio.create_task(autonomous_schema_synthesis_loop())

    # Запускаємо Autonomous Harvester loop
    async def autonomous_harvester_loop():
        from app.core.harvester import Harvester
        logger.info("Harvester: Autonomous Harvesting loop запущено")
        producer = AIOKafkaProducer(bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS)
        await producer.start()
        try:
            harvester = Harvester(producer)
            while True:
                try:
                    await harvester.harvest_all()
                except Exception as e:
                    logger.error(f"Harvester error: {e}")
                # Періодичність сканування: кожні 12 годин (умовно 43200 секунд), для тесту - 60 секунд
                await asyncio.sleep(60)
        finally:
            await producer.stop()
            
    harvester_task = asyncio.create_task(autonomous_harvester_loop())

    await stop_event.wait()
    logger.info("ingestion_worker.stopping")
    consumer_task.cancel()
    watchdog_task.cancel()
    ass_task.cancel()
    harvester_task.cancel()
    with contextlib.suppress(asyncio.CancelledError):
        await asyncio.gather(consumer_task, watchdog_task, ass_task, harvester_task)

    # Зупиняємо health check сервер
    await stop_health_server(health_runner)
    logger.info("ingestion_worker.stopped")


if __name__ == "__main__":
    asyncio.run(main())
