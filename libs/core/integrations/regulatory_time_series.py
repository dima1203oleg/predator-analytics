"""Time-series аналіз для нормативних актів.

Модуль для аналізу впливу нормативних актів на імпорт товарів.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import Any

logger = logging.getLogger(__name__)


@dataclass
class TimeSeriesPoint:
    """Точка часового ряду."""
    date: date
    value: float


@dataclass
class RegulatoryImpactAnalysis:
    """Результат аналізу впливу нормативного акту."""
    act_date: date
    uktzed_code: str
    import_before: float
    import_after: float
    growth_pct: float
    is_suspicious: bool
    confidence: float
    trend: str  # "increasing", "decreasing", "stable"


class RegulatoryTimeSeriesAnalyzer:
    """Аналізатор часових рядів для нормативних актів."""

    def __init__(self):
        self.window_days = 30  # Вікно аналізу
        self.growth_threshold = 200.0  # Поріг підозрілості (%)

    def calculate_import_volume(
        self,
        uktzed_code: str,
        start_date: date,
        end_date: date,
    ) -> float:
        """Розрахувати обсяг імпорту за період.
        
        Args:
            uktzed_code: Код УКТЗЕД
            start_date: Початкова дата
            end_date: Кінцева дата
            
        Returns:
            Обсяг імпорту в USD
        """
        # TODO: Отримувати дані з ClickHouse або PostgreSQL
        # Тимчасова заглушка
        return 1000000.0

    def analyze_regulatory_impact(
        self,
        act_date: date,
        uktzed_code: str,
    ) -> RegulatoryImpactAnalysis:
        """Проаналізувати вплив нормативного акту.
        
        Args:
            act_date: Дата нормативного акту
            uktzed_code: Код УКТЗЕД
            
        Returns:
            Результат аналізу
        """
        # Визначаємо періоди до і після акту
        period_before_start = act_date - timedelta(days=self.window_days)
        period_before_end = act_date - timedelta(days=1)
        
        period_after_start = act_date + timedelta(days=1)
        period_after_end = act_date + timedelta(days=self.window_days)
        
        # Розраховуємо обсяги імпорту
        import_before = self.calculate_import_volume(
            uktzed_code,
            period_before_start,
            period_before_end,
        )
        
        import_after = self.calculate_import_volume(
            uktzed_code,
            period_after_start,
            period_after_end,
        )
        
        # Розраховуємо зростання
        if import_before > 0:
            growth_pct = ((import_after - import_before) / import_before) * 100
        else:
            growth_pct = 0.0
        
        # Визначаємо чи підозріло
        is_suspicious = growth_pct > self.growth_threshold
        
        # Визначаємо тренд
        if growth_pct > 50:
            trend = "increasing"
        elif growth_pct < -50:
            trend = "decreasing"
        else:
            trend = "stable"
        
        # Розраховуємо впевненість
        confidence = min(abs(growth_pct) / 100, 1.0)
        
        return RegulatoryImpactAnalysis(
            act_date=act_date,
            uktzed_code=uktzed_code,
            import_before=import_before,
            import_after=import_after,
            growth_pct=growth_pct,
            is_suspicious=is_suspicious,
            confidence=confidence,
            trend=trend,
        )

    def detect_suspicious_spikes(
        self,
        uktzed_code: str,
        start_date: date,
        end_date: date,
    ) -> list[dict[str, Any]]:
        """Виявити підозрілі сплески імпорту.
        
        Args:
            uktzed_code: Код УКТЗЕД
            start_date: Початкова дата
            end_date: Кінцева дата
            
        Returns:
            Список підозрілих сплесків
        """
        # TODO: Отримати нормативні акти за період
        # Тимчасова заглушка
        return []


class RegulatoryImpactService:
    """Сервіс для аналізу впливу нормативних актів."""

    def __init__(self):
        self.analyzer = RegulatoryTimeSeriesAnalyzer()

    def analyze_act_impact(
        self,
        act_date: date,
        uktzed_code: str,
    ) -> RegulatoryImpactAnalysis:
        """Проаналізувати вплив конкретного акту.
        
        Args:
            act_date: Дата нормативного акту
            uktzed_code: Код УКТЗЕД
            
        Returns:
            Результат аналізу
        """
        return self.analyzer.analyze_regulatory_impact(act_date, uktzed_code)

    def detect_all_suspicious_acts(
        self,
        uktzed_code: str,
        start_date: date,
        end_date: date,
    ) -> list[RegulatoryImpactAnalysis]:
        """Виявити всі підозрілі нормативні акти за період.
        
        Args:
            uktzed_code: Код УКТЗЕД
            start_date: Початкова дата
            end_date: Кінцева дата
            
        Returns:
            Список підозрілих актів
        """
        # TODO: Отримати всі акти за період та проаналізувати
        return []


# Синглтон
_regulatory_service: RegulatoryImpactService | None = None


def get_regulatory_service() -> RegulatoryImpactService:
    """Отримати синглтон інстанс сервісу нормативних актів."""
    global _regulatory_service
    if _regulatory_service is None:
        _regulatory_service = RegulatoryImpactService()
    return _regulatory_service
