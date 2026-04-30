"""Predator v55.0 — Administrative Asymmetry Index (AAI).

Formula (spec 6.4):
    AAI = |AvgReleaseTime(region) - NationalMean| / NationalMean

Detects institutional biases in customs processing times.
Output: 0-100 scale (higher = more asymmetric).
"""

from __future__ import annotations


def calculate_aai(
    avg_release_time_region: float,
    national_mean: float,
) -> float:
    """Calculate Administrative Asymmetry Index.

    Args:
        avg_release_time_region: Average release time for the region (hours).
        national_mean: National average release time (hours).

    Returns:
        AAI score (0-100). Higher = more deviation from national mean.

    """
    if national_mean <= 0:
        return 0.0

    raw = abs(avg_release_time_region - national_mean) / national_mean

    # Cap at 100 (200% deviation from mean)
    return round(max(0.0, min(100.0, raw * 100.0)), 2)
