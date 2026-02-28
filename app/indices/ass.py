"""Predator v55.0 — Adaptation Speed Score (ASS).

Formula (spec 6.2):
    ASS = 1 / (Δt_regulation + 1)

Measures how quickly an entity adapts to regulatory changes.
Output: 0-100 scale (higher = faster adaptation).
"""

from __future__ import annotations


def calculate_ass(
    delta_t_regulation: float,
    max_expected_days: float = 365.0,
) -> float:
    """Calculate Adaptation Speed Score.

    Args:
        delta_t_regulation: Days between regulatory change and entity's adaptation.
        max_expected_days: Maximum expected adaptation period for normalization.

    Returns:
        ASS score (0-100). Higher = faster adaptation.
    """
    if delta_t_regulation < 0:
        delta_t_regulation = 0.0

    raw = 1.0 / (delta_t_regulation + 1.0)

    # Normalize to 0-100 scale
    # When delta_t = 0 → raw = 1.0 → score = 100
    # When delta_t = max → raw ≈ 0 → score ≈ 0
    score = raw * 100.0

    return round(max(0.0, min(100.0, score)), 2)
