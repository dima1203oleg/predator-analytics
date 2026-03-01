"""Predator v55.0 — Confidence Score System.

Every signal, score, and prediction MUST have a Confidence Score.
Formula (from spec 3.14):
    Confidence = 0.30 * data_completeness
               + 0.20 * model_stability
               + 0.20 * historical_accuracy
               + 0.15 * (1 - index_variance)
               + 0.15 * (1 - drift_score)

Penalty: if data_lag > threshold → confidence × 0.7
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class ConfidenceScore(BaseModel):
    """Confidence score with breakdown of contributing factors."""

    total: float = Field(ge=0.0, le=1.0, description="Overall confidence (0-1)")
    data_completeness: float = Field(ge=0.0, le=1.0)
    model_stability: float = Field(ge=0.0, le=1.0)
    historical_accuracy: float = Field(ge=0.0, le=1.0)
    index_variance: float = Field(ge=0.0, le=1.0)
    drift_score: float = Field(ge=0.0, le=1.0)
    penalty_applied: bool = Field(default=False, description="True if lag penalty was applied")


def calculate_confidence(
    data_completeness: float,
    model_stability: float,
    historical_accuracy: float,
    index_variance: float,
    drift_score: float,
    data_lag_days: int = 0,
    lag_threshold_days: int = 30,
) -> ConfidenceScore:
    """Calculate confidence score per spec 3.14.

    Args:
        data_completeness: How complete the input data is (0-1).
        model_stability: How stable the model predictions are (0-1).
        historical_accuracy: Historical accuracy of the model (0-1).
        index_variance: Variance of the index values (0-1, lower is better).
        drift_score: Model drift score (0-1, lower is better).
        data_lag_days: How stale the data is in days.
        lag_threshold_days: Threshold for applying penalty (default 30 per spec 3.13).

    Returns:
        ConfidenceScore with total and breakdown.
    """
    # Clamp inputs to [0, 1]
    dc = max(0.0, min(1.0, data_completeness))
    ms = max(0.0, min(1.0, model_stability))
    ha = max(0.0, min(1.0, historical_accuracy))
    iv = max(0.0, min(1.0, index_variance))
    ds = max(0.0, min(1.0, drift_score))

    total = 0.30 * dc + 0.20 * ms + 0.20 * ha + 0.15 * (1.0 - iv) + 0.15 * (1.0 - ds)

    penalty_applied = False
    if data_lag_days > lag_threshold_days:
        total *= 0.7
        penalty_applied = True

    return ConfidenceScore(
        total=round(max(0.0, min(1.0, total)), 4),
        data_completeness=dc,
        model_stability=ms,
        historical_accuracy=ha,
        index_variance=iv,
        drift_score=ds,
        penalty_applied=penalty_applied,
    )


def quick_confidence(data_completeness: float = 0.5) -> ConfidenceScore:
    """Generate a quick confidence score when detailed metrics are unavailable.

    Uses conservative defaults for unknown factors.
    """
    return calculate_confidence(
        data_completeness=data_completeness,
        model_stability=0.5,
        historical_accuracy=0.5,
        index_variance=0.5,
        drift_score=0.5,
    )
