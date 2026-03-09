"""
Confidence Score Calculator (Phase 5 — SM Edition).

Implements §9.8 formula:
confidence = 0.30·completeness + 0.20·stability + 0.20·accuracy + 0.15·variance + 0.15·drift
"""
from datetime import datetime, timezone
from typing import Any


WEIGHTS: dict[str, float] = {
    "completeness": 0.30,
    "stability": 0.20,
    "accuracy": 0.20,
    "variance": 0.15,
    "drift": 0.15,
}


class ConfidenceScoreCalculator:
    """Розрахунок Confidence Score для CERS рішень."""

    def __init__(self) -> None:
        self.weights = WEIGHTS.copy()

    def calculate(
        self,
        completeness: float,
        stability: float,
        accuracy: float,
        variance: float,
        drift: float,
    ) -> dict[str, Any]:
        """Розрахувати Confidence Score.

        Всі параметри від 0.0 до 1.0.
        """
        score = (
            self.weights["completeness"] * completeness
            + self.weights["stability"] * stability
            + self.weights["accuracy"] * accuracy
            + self.weights["variance"] * variance
            + self.weights["drift"] * drift
        )
        return {
            "confidence_score": round(score, 4),
            "components": {
                "completeness": {"value": completeness, "weight": self.weights["completeness"]},
                "stability": {"value": stability, "weight": self.weights["stability"]},
                "accuracy": {"value": accuracy, "weight": self.weights["accuracy"]},
                "variance": {"value": variance, "weight": self.weights["variance"]},
                "drift": {"value": drift, "weight": self.weights["drift"]},
            },
            "calculated_at": datetime.now(timezone.utc).isoformat(),
        }

    def get_config(self) -> dict[str, Any]:
        """Конфігурація Confidence Score."""
        return {
            "formula": "0.30·completeness + 0.20·stability + 0.20·accuracy + 0.15·variance + 0.15·drift",
            "weights": self.weights,
            "range": [0.0, 1.0],
        }
