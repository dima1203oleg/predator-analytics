"""Базова архітектура для парсингу даних з різних джерел.

Підтримує:
- Публічні реєстри
- Даркнет джерела
- Telegram канали
- Веб-сайти
- Автоматичний підбір парсерів ШІ
"""

from __future__ import annotations

import logging
import os
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Any

import httpx

logger = logging.getLogger(__name__)


class DataSourceType(Enum):
    """Тип джерела даних."""
    PUBLIC_REGISTRY = "public_registry"
    DARKNET = "darknet"
    TELEGRAM = "telegram"
    WEBSITE = "website"
    API = "api"


@dataclass
class ParseResult:
    """Результат парсингу."""
    source_type: DataSourceType
    source_url: str
    data: list[dict[str, Any]]
    parsed_at: datetime
    errors: list[str] = None


@dataclass
class ParserConfig:
    """Конфігурація парсера."""
    source_url: str
    parse_interval_minutes: int = 60
    enabled: bool = True
    max_retries: int = 3
    timeout_seconds: int = 30


class BaseParser(ABC):
    """Базовий клас для всіх парсерів."""

    def __init__(self, config: ParserConfig):
        self.config = config
        self.client = httpx.AsyncClient(timeout=config.timeout_seconds)
        self.last_parse_time = None

    @abstractmethod
    async def parse(self) -> ParseResult:
        """Парсити дані з джерела.
        
        Returns:
            Результат парсингу
        """
        pass

    @abstractmethod
    async def validate_source(self) -> bool:
        """Перевірити доступність джерела.
        
        Returns:
            True якщо джерело доступне
        """
        pass

    async def fetch_data(self) -> str | bytes:
        """Отримати дані з джерела.
        
        Returns:
            Дані у вигляді рядка або байтів
        """
        try:
            response = await self.client.get(self.config.source_url)
            response.raise_for_status()
            
            content_type = response.headers.get("content-type", "")
            if "application/json" in content_type:
                return response.text
            elif "text/html" in content_type:
                return response.text
            else:
                return response.content
                
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP помилка при отриманні даних: {e}")
            raise
        except Exception as e:
            logger.error(f"Помилка отримання даних: {e}")
            raise

    async def close(self):
        """Закрити HTTP клієнт."""
        await self.client.aclose()


class ParserRegistry:
    """Реєстр парсерів для управління всіма парсерами."""

    def __init__(self):
        self.parsers: dict[str, BaseParser] = {}
        self.parser_configs: dict[str, ParserConfig] = {}

    def register_parser(self, name: str, parser: BaseParser, config: ParserConfig):
        """Зареєструвати парсер.
        
        Args:
            name: Назва парсера
            parser: Інстанс парсера
            config: Конфігурація парсера
        """
        self.parsers[name] = parser
        self.parser_configs[name] = config
        logger.info(f"Парсер зареєстровано: {name}")

    def get_parser(self, name: str) -> BaseParser | None:
        """Отримати парсер за назвою.
        
        Args:
            name: Назва парсера
            
        Returns:
            Інстанс парсера або None
        """
        return self.parsers.get(name)

    def list_parsers(self) -> list[str]:
        """Отримати список всіх парсерів.
        
        Returns:
            Список назв парсерів
        """
        return list(self.parsers.keys())

    def get_enabled_parsers(self) -> list[str]:
        """Отримати список увімкнених парсерів.
        
        Returns:
            Список назв увімкнених парсерів
        """
        return [
            name for name, config in self.parser_configs.items()
            if config.enabled
        ]


# Глобальний реєстр парсерів
_parser_registry = ParserRegistry()


def get_parser_registry() -> ParserRegistry:
    """Отримати глобальний реєстр парсерів."""
    return _parser_registry


def register_parser(name: str, parser: BaseParser, config: ParserConfig):
    """Зареєструвати парсер в глобальному реєстрі.
    
    Args:
        name: Назва парсера
        parser: Інстанс парсера
        config: Конфігурація парсера
    """
    _parser_registry.register_parser(name, parser, config)


class AIAnalyzer:
    """ШІ аналізатор для автоматичного підбору парсерів."""

    def __init__(self):
        # TODO: Інтегрувати з LLM для аналізу джерел
        pass

    async def analyze_source(self, source_url: str) -> dict[str, Any]:
        """Проаналізувати джерело даних.
        
        Args:
            source_url: URL джерела
            
        Returns:
            Результат аналізу
        """
        # TODO: Використати LLM для аналізу структури джерела
        # та рекомендації по створенню парсера
        
        return {
            "source_url": source_url,
            "source_type": "unknown",
            "recommended_parser": "generic",
            "confidence": 0.0,
        }

    async def generate_parser_code(self, source_url: str, sample_data: str) -> str:
        """Згенерувати код парсера.
        
        Args:
            source_url: URL джерела
            sample_data: Зразок даних
            
        Returns:
            Згенерований код парсера
        """
        # TODO: Використати LLM для генерації коду парсера
        pass


def get_ai_analyzer() -> AIAnalyzer:
    """Отримати інстанс ШІ аналізатора."""
    return AIAnalyzer()
