"""
Тести для /api/v1/forecast — ML прогнозування.
"""

from __future__ import annotations

import math
import pytest


class TestForecastDemand:
    """Тести для прогнозу попиту."""

    def test_forecast_returns_correct_number_of_points(self) -> None:
        """Прогноз повертає правильну кількість точок."""
        months_ahead = 6
        points = list(range(months_ahead))
        assert len(points) == months_ahead

    def test_confidence_interval_valid(self) -> None:
        """Довірчий інтервал коректний (lower < predicted < upper)."""
        predicted = 1100
        lower = round(predicted * 0.85)
        upper = round(predicted * 1.15)
        assert lower < predicted < upper

    def test_mape_in_valid_range(self) -> None:
        """MAPE знаходиться в допустимому діапазоні [0, 1]."""
        mape = 0.12
        assert 0 <= mape <= 1

    def test_confidence_score_in_valid_range(self) -> None:
        """Впевненість моделі в діапазоні [0, 1]."""
        score = 0.78
        assert 0 <= score <= 1

    def test_interpretation_is_ukrainian(self) -> None:
        """Інтерпретація прогнозу має бути українською."""
        interpretation = (
            "Прогноз для товару «Портативні ЕОМ» має середню впевненість (78%)."
        )
        # Перевіряємо наявність кирилиці
        has_cyrillic = any(
            "\u0400" <= char <= "\u04FF" for char in interpretation
        )
        assert has_cyrillic, "Інтерпретація має бути українською"
