"""Predator v55.0 — Hidden Concentration Index (HCI).

Formula (spec 6.7):
    HCI = HHI_beneficial - HHI_formal

Detects hidden market concentration by comparing beneficial ownership HHI
with formal (registered) ownership HHI.
Output: -10000 to +10000 scale (positive = hidden concentration exists).
"""

from __future__ import annotations


def calculate_hhi(shares: list[float]) -> float:
    """Calculate Herfindahl-Hirschman Index.

    Args:
        shares: Market shares as fractions (0-1), must sum to ~1.0.

    Returns:
        HHI value (0-10000).
    """
    if not shares:
        return 0.0
    return sum(s * s for s in shares) * 10000.0


def calculate_hci(
    hhi_beneficial: float,
    hhi_formal: float,
) -> float:
    """Calculate Hidden Concentration Index.

    Args:
        hhi_beneficial: HHI based on beneficial ownership (0-10000).
        hhi_formal: HHI based on formal (registered) ownership (0-10000).

    Returns:
        HCI value. Positive = hidden concentration.
        Normalized to 0-100 scale for CERS integration.
    """
    raw = hhi_beneficial - hhi_formal

    # Normalize: raw range is roughly -10000 to +10000
    # Map to 0-100 where 50 = neutral, >50 = hidden concentration
    normalized = 50.0 + (raw / 10000.0) * 50.0
    return round(max(0.0, min(100.0, normalized)), 2)
