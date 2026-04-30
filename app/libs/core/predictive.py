"""🔮 PREDICTIVE CORTEX - Future Foresight Engine.
==============================================
Core component for AZR v41 Sovereign Architecture.

This module provides:
- Mathematical trend analysis (Linear Regression)
- Time-series forecasting
- Anomaly prediction (predicting failures BEFORE they happen)

Constitutional Enforcement:
- Axiom 16: Autonomous Evolution (Proactive adaptation)

Python 3.12 | Ukrainian Documentation
"""

from __future__ import annotations

from dataclasses import dataclass
import logging

logger = logging.getLogger("predictive_cortex")


@dataclass
class Prediction:
    """Forecast for a metric."""

    metric_name: str
    current_value: float
    predicted_value_5min: float
    trend: str  # "stable", "increasing", "decreasing", "spike"
    confidence: float


class PredictiveCortex:
    """🔮 Прогностичний Кортекс.

    Використовує математичні моделі для передбачення стану системи
    на основі історії метрик.
    """

    def __init__(self, history_window: int = 20):
        self.history_window = history_window

    def predict_next(self, metric_name: str, history: list[float]) -> Prediction:
        """Predict value 5 steps ahead using Linear Regression (Least Squares).
        y = mx + c.
        """
        if len(history) < 2:
            return Prediction(metric_name, history[-1] if history else 0.0, 0.0, "unknown", 0.0)

        # Use only recent window
        data = history[-self.history_window :]
        n = len(data)

        # X coordinates (0, 1, 2...)
        x = list(range(n))
        y = data

        # Calculate slope (m) and intercept (c)
        sum_x = sum(x)
        sum_y = sum(y)
        sum_xy = sum(i * j for i, j in zip(x, y, strict=False))
        sum_xx = sum(i * i for i in x)

        # Avoid division by zero
        denominator = n * sum_xx - sum_x * sum_x
        if denominator == 0:
            m = 0
            c = sum_y / n
        else:
            m = (n * sum_xy - sum_x * sum_y) / denominator
            c = (sum_y - m * sum_x) / n

        # Predict 5 steps ahead (representing ~2.5 mins if cycle is 30s)
        future_x = n + 5
        predicted_val = m * future_x + c
        predicted_val = max(0.0, min(100.0, predicted_val))  # Clamp to 0-100%

        # Analyze trend
        if m > 0.5:
            trend = "spike"
        elif m > 0.1:
            trend = "increasing"
        elif m < -0.1:
            trend = "decreasing"
        else:
            trend = "stable"

        return Prediction(
            metric_name=metric_name,
            current_value=y[-1],
            predicted_value_5min=predicted_val,
            trend=trend,
            confidence=min(1.0, n / 10.0),  # More data = more confidence
        )


# Singleton
_predictor: PredictiveCortex | None = None


def get_predictor() -> PredictiveCortex:
    global _predictor
    if _predictor is None:
        _predictor = PredictiveCortex()
    return _predictor
