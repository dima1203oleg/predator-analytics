"""Система постійного парсингу даних.

Підтримує:
- Плановий запуск парсерів
- Моніторинг стану парсерів
- Обробка помилок та повторні спроби
- Розподіл спаршених даних по базах
"""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Any

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from libs.core.etl.multi_database_etl import MultiDatabaseETL, DatabaseConfig
from libs.core.parsers.base import get_parser_registry, ParseResult

logger = logging.getLogger(__name__)


class ParserScheduler:
    """Планувальник парсерів для постійного парсингу."""

    def __init__(self, db_config: DatabaseConfig):
        self.scheduler = AsyncIOScheduler()
        self.parser_registry = get_parser_registry()
        self.db_config = db_config
        self.running = False

    async def start(self):
        """Запустити планувальник."""
        if self.running:
            logger.warning("Планувальник вже запущено")
            return
        
        self.running = True
        
        # Додати завдання для кожного парсера
        for parser_name in self.parser_registry.list_parsers():
            config = self.parser_registry.parser_configs.get(parser_name)
            if config and config.enabled:
                self.scheduler.add_job(
                    self.run_parser,
                    'interval',
                    minutes=config.parse_interval_minutes,
                    args=[parser_name],
                    id=f"parser_{parser_name}",
                    replace_existing=True,
                )
                logger.info(f"Планувальник додано для парсера: {parser_name}")
        
        self.scheduler.start()
        logger.info("Планувальник парсерів запущено")

    async def stop(self):
        """Зупинити планувальник."""
        if not self.running:
            return
        
        self.scheduler.shutdown()
        self.running = False
        logger.info("Планувальник парсерів зупинено")

    async def run_parser(self, parser_name: str):
        """Запустити парсер.
        
        Args:
            parser_name: Назва парсера
        """
        logger.info(f"Запуск парсера: {parser_name}")
        
        parser = self.parser_registry.get_parser(parser_name)
        if not parser:
            logger.error(f"Парсер не знайдено: {parser_name}")
            return
        
        try:
            # Перевірка доступності джерела
            is_valid = await parser.validate_source()
            if not is_valid:
                logger.warning(f"Джерело недоступне для парсера {parser_name}")
                return
            
            # Парсинг даних
            result = await parser.parse()
            
            if result.errors:
                logger.error(f"Помилки парсингу {parser_name}: {result.errors}")
            
            # Розподіл спаршених даних по базах
            if result.data:
                await self.distribute_data(result)
            
            logger.info(f"Парсер {parser_name} завершено: {len(result.data)} записів")
            
        except Exception as e:
            logger.error(f"Критична помилка парсера {parser_name}: {e}")

    async def distribute_data(self, parse_result: ParseResult):
        """Розподілити спаршені дані по базах даних.
        
        Args:
            parse_result: Результат парсингу
        """
        # TODO: Реалізувати розподіл даних по базах
        # Використовувати MultiDatabaseETL
        
        logger.info(f"Розподіл {len(parse_result.data)} записів по базах")
        
        # Тимчасова заглушка - просто логування
        for record in parse_result.data:
            logger.debug(f"Запис для розподілу: {record}")

    async def add_parser(self, parser_name: str, parser_config: dict[str, Any]):
        """Додати новий парсер до планувальника.
        
        Args:
            parser_name: Назва парсера
            parser_config: Конфігурація парсера
        """
        # TODO: Реалізувати динамічне додавання парсерів
        logger.info(f"Додавання парсера: {parser_name}")


class ParserMonitor:
    """Моніторинг стану парсерів."""

    def __init__(self):
        self.parser_registry = get_parser_registry()

    async def get_status(self) -> dict[str, Any]:
        """Отримати статус всіх парсерів.
        
        Returns:
            Статус парсерів
        """
        status = {}
        
        for parser_name in self.parser_registry.list_parsers():
            config = self.parser_registry.parser_configs.get(parser_name)
            status[parser_name] = {
                "enabled": config.enabled if config else False,
                "source_url": config.source_url if config else None,
                "parse_interval": config.parse_interval_minutes if config else None,
                "last_parse": None,  # TODO: Отримувати з БД
            }
        
        return status

    async def get_errors(self, limit: int = 100) -> list[dict[str, Any]]:
        """Отримати останні помилки парсерів.
        
        Args:
            limit: Ліміт результатів
            
        Returns:
            Список помилок
        """
        # TODO: Отримувати помилки з БД
        return []


async def start_parser_scheduler(db_config: DatabaseConfig):
    """Запустити планувальник парсерів.
    
    Args:
        db_config: Конфігурація бази даних
    """
    scheduler = ParserScheduler(db_config)
    await scheduler.start()
    return scheduler


async def stop_parser_scheduler(scheduler: ParserScheduler):
    """Зупинити планувальник парсерів.
    
    Args:
        scheduler: Інстанс планувальника
    """
    await scheduler.stop()
