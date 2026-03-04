"""Predator v55.0 — Influence Engine.

Discovers power centers, hidden networks, shadow clusters.
Computes: IM, HCI, Shadow Cluster Score.

Input: Entity Graph (Neo4j).
Output: InfluenceScore per UEID.
"""

from __future__ import annotations

from dataclasses import dataclass
import logging
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.confidence import ConfidenceScore, quick_confidence
from app.core.signal_bus import SignalBus
from app.indices.hci import calculate_hci
from app.indices.im import calculate_im
from app.models.v55.signal import SignalLayer, SignalPriority, V55Signal


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
        ueid,
        im,
        hci,
        aggregate,
    )

    return InfluenceScore(
        ueid=ueid,
        im=im,
        hci=hci,
        shadow_cluster_score=round(shadow_cluster_score, 2),
        aggregate=aggregate,
        confidence=confidence,
    )


async def process_entity(ueid: str, session: AsyncSession) -> InfluenceScore:
    """Run Influence Analysis for a specific entity.
    Features async DB persistence and real-time scaling out via SignalBus.
    """
    from app.repositories.influence_repository import InfluenceRepository
    repo = InfluenceRepository(session)
    
    # 🚨 PREDATOR LAZY LOADING / MOCKS
    # Temporarily generate semi-random metrics until full Neo4j Graph queries are injected
    import random
    eigenvector = random.uniform(0.1, 0.9)
    betweenness = random.uniform(0.1, 0.8)
    market_share = random.uniform(0.01, 0.5)
    reg_prox = random.uniform(0.0, 1.0)
    hhi_ben = random.uniform(1000, 8000)
    hhi_form = random.uniform(1000, 8000)
    shadow = random.uniform(0.0, 100.0)
    data_comp = random.uniform(0.4, 1.0)

    score = compute_influence_score(
        ueid,
        eigenvector=eigenvector,
        betweenness=betweenness,
        market_share=market_share,
        regulatory_proximity=reg_prox,
        hhi_beneficial=hhi_ben,
        hhi_formal=hhi_form,
        shadow_cluster_score=shadow,
        data_completeness=data_comp,
    )

    # 1. DB Persistence
    await repo.save_score(score)

    # 2. Emit Signal (v55 standard)
    bus = SignalBus.get_instance()
    signal = V55Signal(
        signal_type="INFLUENCE_SCORING",
        topic="influence.analyzed",
        ueid=ueid,
        layer=SignalLayer.INFLUENCE,
        priority=SignalPriority.CRITICAL if score.aggregate > 80 else SignalPriority.HIGH if score.aggregate > 60 else SignalPriority.ROUTINE,
        score=score.aggregate,
        confidence=score.confidence.final_score,
        summary=f"Вплив оновлено: IM={score.im:.1f}, HCI={score.hci:.1f}, Shadow={score.shadow_cluster_score:.1f}",
        metadata={
            "im": score.im,
            "hci": score.hci,
            "shadow_cluster": score.shadow_cluster_score
        }
    )
    # emit expects db session for persistence fallback
    await bus.emit(signal, session=session)

    logger.info("Influence Engine processed ueid=%s, agg=%.1f", ueid, score.aggregate)
    return score
