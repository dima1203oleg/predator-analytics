"""Structured JSON Logging — для PREDATOR Analytics v61.0-ELITE.

Надає структуроване JSON логування через structlog.
Кожен лог включає: timestamp, level, logger, message,
correlation_id, service, та довільні контекстні поля.

Використання:
    from predator_common.logging import get_logger

    logger = get_logger(__name__)
    logger.info("Компанію додано", edrpou="12345678", action="create")
"""

import asyncio
import contextlib
from datetime import UTC, datetime
import json
import logging
import os
import queue
import sys
import threading
from typing import Any, Optional

import structlog


def configure_logging(
    log_level: str = "INFO",
    service_name: str = "predator",
    json_logs: bool = True,
    cloud_mode: bool = False,
) -> None:
    """Налаштувати structured logging для сервісу.

    Args:
        log_level: Рівень логування (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        service_name: Назва сервісу (додається до кожного логу)
        json_logs: True — JSON форматування, False — консольне (для розробки)
        cloud_mode: True — відправляти критичні логи в Kafka (для хмарних вузлів)

    """
    log_level_num = getattr(logging, log_level.upper(), logging.INFO)

    # Базове налаштування stdlib logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=log_level_num,
    )

    # Процесори structlog
    shared_processors: list[Any] = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso", utc=True),
        structlog.processors.StackInfoRenderer(),
        _add_service_name(service_name),
    ]

    # Додаємо Kafka процесор якщо cloud_mode активовано
    if cloud_mode:
        kafka_processor = KafkaLogProcessor(service_name=service_name)
        shared_processors.insert(-1, kafka_processor)

    if json_logs:
        # JSON для production та Docker
        shared_processors.append(structlog.processors.format_exc_info)
        renderer: Any = structlog.processors.JSONRenderer()
    else:
        # Кольорові логи для локальної розробки
        shared_processors.append(structlog.dev.ConsoleRenderer())
        renderer = structlog.dev.ConsoleRenderer()

    structlog.configure(
        processors=[
            *shared_processors,
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        wrapper_class=structlog.make_filtering_bound_logger(log_level_num),
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )

    # Форматтер для stdlib обробників
    formatter = structlog.stdlib.ProcessorFormatter(
        processor=renderer,
        foreign_pre_chain=shared_processors,
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)

    root_logger = logging.getLogger()
    root_logger.handlers = [handler]
    root_logger.setLevel(log_level_num)


def _add_service_name(service_name: str) -> Any:
    """Процесор: додає service field до кожного логу."""
    def add_service(
        _logger: Any,
        _method_name: str,
        event_dict: dict[str, Any],
    ) -> dict[str, Any]:
        event_dict["service"] = service_name
        return event_dict
    return add_service


class KafkaLogProcessor:
    """Процесор structlog для відправки логів у Kafka."""

    def __init__(self, service_name: str):
        self.service_name = service_name
        self.writer = KafkaBackgroundWriter()
        self.writer.start()

    def __call__(
        self,
        _logger: Any,
        method_name: str,
        event_dict: dict[str, Any],
    ) -> dict[str, Any]:
        """Відправляє лог у Kafka, якщо рівень ERROR або вище."""
        # Відправляємо тільки ERROR та CRITICAL (TZ §4.1)
        if method_name in ("error", "critical"):
            self.writer.enqueue(event_dict)
        return event_dict


class KafkaBackgroundWriter:
    """Фоновий потік для асинхронної відправки логів у Kafka."""

    _instance: Optional["KafkaBackgroundWriter"] = None
    _lock = threading.Lock()

    def __new__(cls) -> "KafkaBackgroundWriter":
        with cls._lock:
            if cls._instance is None:
                cls._instance = super().__new__(cls)
            return cls._instance

    def __init__(self) -> None:
        if hasattr(self, "_initialized"):
            return
        self._queue: queue.Queue[dict[str, Any]] = queue.Queue(maxsize=1000)
        self._thread: threading.Thread | None = None
        self._stop_event = threading.Event()
        self._initialized = True

    def start(self) -> None:
        """Запустити фоновий потік."""
        if self._thread and self._thread.is_alive():
            return
        self._thread = threading.Thread(target=self._run, daemon=True)
        self._thread.start()

    def enqueue(self, event: dict[str, Any]) -> None:
        """Додати лог у чергу."""
        with contextlib.suppress(queue.Full):
            self._queue.put_nowait(event)

    def _run(self) -> None:
        """Основний цикл потоку з власним event loop."""
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(self._async_run())

    async def _async_run(self) -> None:
        """Асинхронний цикл відправки."""
        from aiokafka import AIOKafkaProducer

        brokers = os.environ.get("KAFKA_BROKERS", "localhost:9092")
        tenant_id = os.environ.get("TENANT_ID", "default")
        topic = f"tenant.{tenant_id}.system.log"

        producer = AIOKafkaProducer(bootstrap_servers=brokers)
        try:
            await producer.start()
            while not self._stop_event.is_set():
                try:
                    # Отримуємо лог з черги (неблокуюче)
                    event = self._queue.get(timeout=1.0)

                    # Формуємо подію згідно з SystemLogEvent схемою
                    log_event = {
                        "header": {
                            "event_id": event.get("correlation_id") or str(asyncio.get_event_loop().time()),
                            "event_type": "system.log",
                            "tenant_id": tenant_id,
                            "timestamp": datetime.now(UTC).isoformat(),
                            "source": event.get("service", "predator"),
                            "priority": "critical" if event.get("level") == "critical" else "high",
                            "version": "1.0"
                        },
                        "payload": {
                            "level": event.get("level", "error"),
                            "logger": event.get("logger", "unknown"),
                            "message": event.get("event", ""),
                            "service": event.get("service", "unknown"),
                            "timestamp": event.get("timestamp", ""),
                            "context": {k: v for k, v in event.items() if k not in ("level", "logger", "event", "service", "timestamp", "exception")},
                            "exception": event.get("exception")
                        }
                    }

                    await producer.send_and_wait(
                        topic,
                        json.dumps(log_event).encode("utf-8")
                    )
                    self._queue.task_done()
                except queue.Empty:
                    continue
                except Exception:  # noqa: S112
                    # Якщо помилка Kafka, просто продовжуємо (логі зазвичай не повинні валити систему)
                    continue
        finally:
            await producer.stop()


def get_logger(name: str) -> structlog.BoundLogger:
    """Отримати структурований logger.

    Args:
        name: Назва логера (зазвичай __name__)

    Returns:
        structlog.BoundLogger для використання у модулі

    """
    return structlog.get_logger(name)
