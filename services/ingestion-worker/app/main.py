"""Ingestion Worker Main Logic — PREDATOR Analytics v61.0-ELITE Ironclad.

Слухає Kafka події та запускає пайплайни обробки даних:
1. File Ingestion Pipeline — обробка завантажених файлів з MinIO
2. OSINT Enrichment — збагачення компаній через зовнішні реєстри
"""
import asyncio
import contextlib
from datetime import UTC, datetime
import json
import signal
from typing import Any
import uuid
import hashlib

from aiokafka import AIOKafkaConsumer, AIOKafkaProducer
from pydantic import ValidationError

from app.config import get_settings
from app.fusion_engine import ДвигунЗлиттяДаних
from app.health import set_health_status, start_health_server, stop_health_server
from app.pipelines.file_ingestion import FileIngestionPipeline
from app.registries.ua_registries import УкраїнськийРеєстр
from app.sinks.postgres_sink import PostgresSink
from predator_common.logging import get_logger

logger = get_logger("ingestion_worker")
settings = get_settings()

# Канонічні назви топіків (HR-17: tenant.{id}.category.name)
TOPIC_RAW = settings.KAFKA_TOPIC_INGESTION_RAW if hasattr(settings, 'KAFKA_TOPIC_INGESTION_RAW') else "tenant.default.ingestion.raw"
TOPIC_ENRICHED = settings.KAFKA_TOPIC_ENRICHMENT if hasattr(settings, 'KAFKA_TOPIC_ENRICHMENT') else "tenant.default.enrichment.events"


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
            await postgres_sink.update_job_progress(
                job_id=job_id,
                status="processing",
                progress=progress.get("progress_pct", 0),
                records_processed=progress.get("processed_rows", 0),
                records_errors=progress.get("quarantined_rows", 0),
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


async def process_message(
    msg_value: dict[str, Any],
    fusion_engine: ДвигунЗлиттяДаних,
    producer: AIOKafkaProducer,
    postgres_sink: PostgresSink,
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
        if "s3_bucket_path" in msg_value:
            # Це RawFileUpload — завантажений файл
            await process_file_upload(msg_value, producer, postgres_sink)
        elif "edrpou" in msg_value:
            # Це запит на OSINT збагачення
            await process_osint_enrichment(msg_value, fusion_engine, producer)
        else:
            logger.warning(
                "ingestion_worker.unknown_message_type",
                keys=list(msg_value.keys()),
            )
            # Не позначаємо незнайомі формати як успішні, або можна розмістити в quarantine (T1.4)
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
    ua_registry = УкраїнськийРеєстр(base_url="https://opendatabot.com/api/v1")
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

    consumer = AIOKafkaConsumer(
        TOPIC_RAW,
        bootstrap_servers=settings.KAFKA_BROKERS,
        group_id="predator-ingestion-group",
        auto_offset_reset="earliest",
        value_deserializer=lambda m: json.loads(m.decode("utf-8")) if m else {},
    )

    producer = AIOKafkaProducer(
        bootstrap_servers=settings.KAFKA_BROKERS,
    )

    await consumer.start()
    await producer.start()
    set_health_status("kafka_connected", True)
    logger.info("ingestion_worker.started", topic=TOPIC_RAW)

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
                    process_message(msg.value, fusion_engine, producer, postgres_sink)
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


async def main() -> None:
    """Точка входу воркера."""
    loop = asyncio.get_running_loop()

    # Запускаємо health check сервер
    health_runner = await start_health_server(port=8080)

    # Graceful shutdown
    stop_event = asyncio.Event()
    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, stop_event.set)

    consumer_task = asyncio.create_task(consume())

    await stop_event.wait()
    logger.info("ingestion_worker.stopping")
    consumer_task.cancel()
    with contextlib.suppress(asyncio.CancelledError):
        await consumer_task

    # Зупиняємо health check сервер
    await stop_health_server(health_runner)
    logger.info("ingestion_worker.stopped")


if __name__ == "__main__":
    asyncio.run(main())
