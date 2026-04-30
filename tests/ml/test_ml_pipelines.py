"""
Тести для ML пайплайнів PREDATOR Analytics v4.1.
"""

from __future__ import annotations

import pytest

from app.ml.anomaly.anomaly_detector import AnomalyDetector
from app.ml.anomaly.risk_scorer import RiskResult, RiskScorer
from app.ml.forecasting.demand_forecaster import DemandForecaster, ForecastResult


class TestDemandForecaster:
    """Тести для DemandForecaster."""

    @pytest.mark.asyncio
    async def test_predict_returns_forecast_result(self) -> None:
        """Прогноз повертає ForecastResult."""
        forecaster = DemandForecaster()
        result = await forecaster.predict("84713000", months_ahead=6)
        assert isinstance(result, ForecastResult)
        assert result.product_code == "84713000"
        assert len(result.forecast) == 6

    @pytest.mark.asyncio
    async def test_confidence_score_valid(self) -> None:
        """Впевненість моделі у допустимому діапазоні."""
        forecaster = DemandForecaster()
        result = await forecaster.predict("84713000")
        assert 0 <= result.confidence_score <= 1

    @pytest.mark.asyncio
    async def test_forecast_points_have_dates(self) -> None:
        """Всі точки прогнозу мають дати."""
        forecaster = DemandForecaster()
        result = await forecaster.predict("84713000", months_ahead=3)
        for point in result.forecast:
            assert point.date
            assert point.predicted_volume > 0

    @pytest.mark.asyncio
    async def test_interpretation_is_ukrainian(self) -> None:
        """Інтерпретація прогнозу українською."""
        forecaster = DemandForecaster()
        result = await forecaster.predict("84713000")
        has_cyrillic = any("\u0400" <= c <= "\u04FF" for c in result.interpretation_uk)
        assert has_cyrillic


class TestAnomalyDetector:
    """Тести для AnomalyDetector."""

    @pytest.mark.asyncio
    async def test_no_anomalies_for_normal_data(self) -> None:
        """Нормальні дані не мають аномалій."""
        detector = AnomalyDetector()
        declarations = [
            {"id": "1", "value_usd": 5000, "weight_kg": 100},
        ]
        anomalies = await detector.detect(declarations)
        assert len(anomalies) == 0

    @pytest.mark.asyncio
    async def test_detects_price_anomaly(self) -> None:
        """Виявляє цінову аномалію."""
        detector = AnomalyDetector()
        declarations = [
            {"id": "1", "value_usd": 1_000_000, "weight_kg": 1},  # $1M/кг
        ]
        anomalies = await detector.detect(declarations)
        assert len(anomalies) >= 1
        assert anomalies[0].anomaly_type == "price"

    @pytest.mark.asyncio
    async def test_detects_volume_anomaly(self) -> None:
        """Виявляє об'ємну аномалію."""
        detector = AnomalyDetector()
        declarations = [
            {"id": "1", "value_usd": 100, "weight_kg": 5_000_000},
        ]
        anomalies = await detector.detect(declarations)
        volume_anomalies = [a for a in anomalies if a.anomaly_type == "volume"]
        assert len(volume_anomalies) >= 1


class TestRiskScorer:
    """Тести для RiskScorer."""

    @pytest.mark.asyncio
    async def test_score_returns_risk_result(self) -> None:
        """Оцінка повертає RiskResult."""
        scorer = RiskScorer()
        result = await scorer.score_company("12345678")
        assert isinstance(result, RiskResult)
        assert result.edrpou == "12345678"

    @pytest.mark.asyncio
    async def test_score_in_valid_range(self) -> None:
        """Ризик-бал у діапазоні 0-100."""
        scorer = RiskScorer()
        result = await scorer.score_company("12345678")
        assert 0 <= result.total_score <= 100

    @pytest.mark.asyncio
    async def test_risk_level_valid(self) -> None:
        """Рівень ризику — один із допустимих."""
        scorer = RiskScorer()
        result = await scorer.score_company("12345678")
        assert result.risk_level in {"low", "medium", "high", "critical"}

    @pytest.mark.asyncio
    async def test_recommendation_is_ukrainian(self) -> None:
        """Рекомендація ризику українською."""
        scorer = RiskScorer()
        result = await scorer.score_company("12345678")
        has_cyrillic = any("\u0400" <= c <= "\u04FF" for c in result.recommendation_uk)
        assert has_cyrillic
