"""Predator v55.0 — Collapse Probability (CP).

Formula (spec 6.3):
    CP = logistic(β₀ + β₁·BVI + β₂·TaxGap + β₃·BrokerShift + β₄·DeclineTrend)

Predicts the probability of entity collapse/disappearance within 6 months.
Output: 0-100 scale (probability percentage).
"""

from __future__ import annotations

import math

# Default coefficients (to be updated from MLflow model registry)
_DEFAULT_COEFFICIENTS = {
    "beta_0": -3.0,
    "beta_bvi": 0.04,
    "beta_tax_gap": 0.03,
    "beta_broker_shift": 0.02,
    "beta_decline_trend": 0.05,
}


def _sigmoid(x: float) -> float:
    """Numerically stable sigmoid function."""
    if x >= 0:
        return 1.0 / (1.0 + math.exp(-x))
    exp_x = math.exp(x)
    return exp_x / (1.0 + exp_x)


def calculate_cp(
    bvi: float,
    tax_gap: float,
    broker_shift: float,
    decline_trend: float,
    coefficients: dict[str, float] | None = None,
) -> float:
    """Calculate Collapse Probability.

    Args:
        bvi: Behavioral Volatility Index (0-100).
        tax_gap: Tax reporting gap percentage (0-100).
        broker_shift: Broker change frequency (0-100).
        decline_trend: Revenue decline trend (0-100).
        coefficients: Optional custom logistic regression coefficients.

    Returns:
        CP score (0-100). Higher = higher collapse probability.

    """
    coefs = coefficients or _DEFAULT_COEFFICIENTS

    z = (
        coefs["beta_0"]
        + coefs["beta_bvi"] * bvi
        + coefs["beta_tax_gap"] * tax_gap
        + coefs["beta_broker_shift"] * broker_shift
        + coefs["beta_decline_trend"] * decline_trend
    )

    probability = _sigmoid(z)
    return round(probability * 100.0, 2)
