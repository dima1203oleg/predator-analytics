"""Канонічне структуроване логування PREDATOR Analytics v4.1.

Використовує structlog для JSON-форматованих логів.
Підключається в app/main.py на старті.

Використання:
    from app.core.logging import configure_logging
    configure_logging()

    import structlog
    logger = structlog.get_logger(__name__)
"""

from __future__ import annotations

import logging
import sys

import structlog


def configure_logging(
    level: str = "INFO",
    json_format: bool = False,
) -> None:
    """Конфігурує структуроване логування для всього застосунку.

    Args:
        level: Рівень логування (DEBUG, INFO, WARNING, ERROR)
        json_format: Якщо True — виводить JSON (для production).
                     Якщо False — виводить кольоровий текст (для dev).

    """
    # Налаштування стандартного logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, level.upper(), logging.INFO),
    )

    # Вибір рендерера: JSON для production, console для dev
    if json_format:
        renderer = structlog.processors.JSONRenderer()
    else:
        renderer = structlog.dev.ConsoleRenderer(
            colors=True,
            pad_event=35,
        )

    # Конфігурація structlog
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.StackInfoRenderer(),
            structlog.dev.set_exc_info,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.EventRenamer("msg"),
            renderer,
        ],
        wrapper_class=structlog.make_filtering_bound_logger(
            getattr(logging, level.upper(), logging.INFO)
        ),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )
