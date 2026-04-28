"""Structured JSON Logging — для PREDATOR Analytics v55.1.

Надає структуроване JSON логування через structlog.
Кожен лог включає: timestamp, level, logger, message,
correlation_id, service, та довільні контекстні поля.

Використання:
    from predator_common.logging import get_logger

    logger = get_logger(__name__)
    logger.info("Компанію додано", edrpou="12345678", action="create")
"""

import logging
import sys
from typing import Any

import structlog


def configure_logging(
    log_level: str = "INFO",
    service_name: str = "predator",
    json_logs: bool = True,
) -> None:
    """Налаштувати structured logging для сервісу.

    Args:
        log_level: Рівень логування (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        service_name: Назва сервісу (додається до кожного логу)
        json_logs: True — JSON форматування, False — консольне (для розробки)

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


def get_logger(name: str) -> structlog.BoundLogger:
    """Отримати структурований logger.

    Args:
        name: Назва логера (зазвичай __name__)

    Returns:
        structlog.BoundLogger для використання у модулі

    """
    return structlog.get_logger(name)
