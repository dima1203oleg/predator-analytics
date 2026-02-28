"""Predator v55.0 — Influence Engine.

Discovers power centers, hidden networks, shadow clusters.
Computes: IM, HCI, Shadow Cluster Score.

Input: Entity Graph (Neo4j).
Output: InfluenceScore per UEID.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass

from app.core.confidence import ConfidenceScore, quick_confidence
from app.indices.hci import calculate_hci
from app.indices.im import calculate_im

logger = logging.getLogger("predator.engines.influence")


@dataclass
class InfluenceScore:
    """Aggregated influence metrics for one entity."""

    ueid: str
    im: float
    hci: float
    shadow_cluster_score: float
    aggregate: float
    confidence: ConfidenceScore


def compute_influence_score(
    ueid: str,
    eigenvector: float,
    betweenness: float,
    market_share: float,
    regulatory_proximity: float,
    hhi_beneficial: float,
    hhi_formal: float,
    shadow_cluster_score: float = 0.0,
    data_completeness: float = 0.5,
) -> InfluenceScore:
    """Compute influence score for an entity.

    Args:
        ueid: Entity UEID.
        eigenvector: Eigenvector centrality (0-1).
        betweenness: Betweenness centrality (0-1).
        market_share: Market share (0-1).
        regulatory_proximity: Proximity to regulatory bodies (0-1).
        hhi_beneficial: HHI of beneficial ownership (0-10000).
        hhi_formal: HHI of formal ownership (0-10000).
        shadow_cluster_score: Pre-computed shadow cluster membership score (0-100).
        data_completeness: Data completeness factor (0-1).

    Returns:
        InfluenceScore with all metrics.
    """
    im = calculate_im(eigenvector, betweenness, market_share, regulatory_proximity)
    hci = calculate_hci(hhi_beneficial, hhi_formal)

    aggregate = 0.40 * im + 0.35 * hci + 0.25 * shadow_cluster_score
    aggregate = round(max(0.0, min(100.0, aggregate)), 2)

    confidence = quick_confidence(data_completeness)

    logger.info(
        "Influence score computed: ueid=%s im=%.1f hci=%.1f agg=%.1f",
        ueid, im, hci, aggregate,
    )

    return InfluenceScore(
        ueid=ueid,
        im=im,
        hci=hci,
        shadow_cluster_score=round(shadow_cluster_score, 2),
        aggregate=aggregate,
        confidence=confidence,
    )
