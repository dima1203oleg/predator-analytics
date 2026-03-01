"""Predator v55.0 — Behavioral Volatility Index (BVI).

Formula (spec 6.1):
    BVI = 0.3·σ(intervals) + 0.25·σ(regions) + 0.25·σ(brokers) + 0.2·σ(price)

Where σ is the coefficient of variation or Shannon entropy index.
Output: 0-100 scale.
"""

from __future__ import annotations

from collections import Counter
import math


def _coefficient_of_variation(values: list[float]) -> float:
    """Calculate coefficient of variation (std/mean)."""
    if not values or len(values) < 2:
        return 0.0
    mean = sum(values) / len(values)
    if abs(mean) < 1e-9:
        return 0.0
    variance = sum((x - mean) ** 2 for x in values) / len(values)
    return math.sqrt(variance) / abs(mean)


def _shannon_entropy(items: list[str]) -> float:
    """Calculate normalized Shannon entropy (0-1) for categorical data."""
    if not items:
        return 0.0
    counts = Counter(items)
    total = len(items)
    n_categories = len(counts)
    if n_categories <= 1:
        return 0.0
    entropy = -sum(
        (count / total) * math.log2(count / total) for count in counts.values() if count > 0
    )
    max_entropy = math.log2(n_categories)
    return entropy / max_entropy if max_entropy > 0 else 0.0


def calculate_bvi(
    intervals: list[float],
    regions: list[str],
    brokers: list[str],
    prices: list[float],
) -> float:
    """Calculate Behavioral Volatility Index.

    Args:
        intervals: Time intervals between declarations (days).
        regions: List of customs regions used.
        brokers: List of broker identifiers used.
        prices: Declared prices per unit.

    Returns:
        BVI score (0-100). Higher = more volatile behavior.
    """
    cv_intervals = _coefficient_of_variation(intervals)
    shannon_regions = _shannon_entropy(regions)
    shannon_brokers = _shannon_entropy(brokers)
    cv_prices = _coefficient_of_variation(prices)

    raw = 0.30 * cv_intervals + 0.25 * shannon_regions + 0.25 * shannon_brokers + 0.20 * cv_prices

    return round(max(0.0, min(100.0, raw * 100.0)), 2)
