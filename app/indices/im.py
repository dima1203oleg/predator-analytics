"""Predator v55.0 — Influence Mass (IM).

Formula (spec 6.6):
    IM = 0.35·Eigenvector + 0.25·Betweenness + 0.25·MarketShare + 0.15·RegulatoryProximity

Composite metric of entity influence in the economic graph.
Output: 0-100 scale.
"""

from __future__ import annotations


def calculate_im(
    eigenvector: float,
    betweenness: float,
    market_share: float,
    regulatory_proximity: float,
) -> float:
    """Calculate Influence Mass.

    All inputs should be pre-normalized to 0-1 scale.

    Args:
        eigenvector: Eigenvector centrality (0-1).
        betweenness: Betweenness centrality (0-1).
        market_share: Market share fraction (0-1).
        regulatory_proximity: Proximity to regulatory bodies (0-1).

    Returns:
        IM score (0-100). Higher = more influential.

    """
    raw = (
        0.35 * eigenvector + 0.25 * betweenness + 0.25 * market_share + 0.15 * regulatory_proximity
    )

    return round(max(0.0, min(100.0, raw * 100.0)), 2)
