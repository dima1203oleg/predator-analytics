"""ШІ генератор парсерів для автоматичного підбору.

Використовує LLM для аналізу джерел та генерації парсерів.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any

from libs.core.parsers.base import AIAnalyzer, ParserConfig

logger = logging.getLogger(__name__)


@dataclass
class ParserGenerationRequest:
    """Запит на генерацію парсера."""
    source_url: str
    sample_data: str | None = None
    source_type: str | None = None
    requirements: str | None = None


@dataclass
class ParserGenerationResult:
    """Результат генерації парсера."""
    parser_name: str
    parser_code: str
    config: ParserConfig
    confidence: float
    errors: list[str] = None


class AIParserGenerator:
    """ШІ генератор парсерів."""

    def __init__(self):
        self.ai_analyzer = AIAnalyzer()

    async def analyze_source(self, source_url: str) -> dict[str, Any]:
        """Проаналізувати джерело даних.
        
        Args:
            source_url: URL джерела
            
        Returns:
            Результат аналізу
        """
        return await self.ai_analyzer.analyze_source(source_url)

    async def generate_parser(
        self,
        request: ParserGenerationRequest,
    ) -> ParserGenerationResult:
        """Згенерувати парсер для джерела.
        
        Args:
            request: Запит на генерацію
            
        Returns:
            Результат генерації
        """
        try:
            # Аналіз джерела
            analysis = await self.analyze_source(request.source_url)
            
            # Генерація коду парсера
            parser_code = await self.ai_analyzer.generate_parser_code(
                request.source_url,
                request.sample_data or ""
            )
            
            # Генерація назви парсера
            parser_name = f"auto_{hash(request.source_url) % 10000:04d}"
            
            # Генерація конфігурації
            config = ParserConfig(
                source_url=request.source_url,
                parse_interval_minutes=60,
                enabled=True,
            )
            
            return ParserGenerationResult(
                parser_name=parser_name,
                parser_code=parser_code,
                config=config,
                confidence=analysis.get("confidence", 0.0),
            )
            
        except Exception as e:
            logger.error(f"Помилка генерації парсера: {e}")
            return ParserGenerationResult(
                parser_name="",
                parser_code="",
                config=ParserConfig(source_url=request.source_url),
                confidence=0.0,
                errors=[str(e)],
            )

    async def suggest_parsers(
        self,
        source_urls: list[str],
    ) -> list[ParserGenerationResult]:
        """Запропонувати парсери для списку джерел.
        
        Args:
            source_urls: Список URL джерел
            
        Returns:
            Список результатів генерації
        """
        results = []
        
        for url in source_urls:
            request = ParserGenerationRequest(source_url=url)
            result = await self.generate_parser(request)
            results.append(result)
        
        return results


def get_ai_parser_generator() -> AIParserGenerator:
    """Отримати інстанс ШІ генератора парсерів."""
    return AIParserGenerator()
