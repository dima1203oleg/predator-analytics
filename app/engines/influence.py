"""Predator v55.0 — Influence Engine.

Discovers power centers, hidden networks, shadow clusters.
Computes: IM, HCI, Shadow Cluster Score.

Input: Entity Graph (Neo4j).
Output: InfluenceScore per UEID.
"""

from __future__ import annotations

from dataclasses import dataclass
import logging
from typing import TYPE_CHECKING

from app.core.confidence import ConfidenceScore, quick_confidence
from app.core.signal_bus import SignalBus
from app.indices.hci import calculate_hci
from app.indices.im import calculate_im
from app.models.v55.signal import SignalLayer, SignalPriority, V55Signal

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

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
    from app.repositories.fused_record_repository import FusedRecordRepository
    from app.repositories.influence_repository import InfluenceRepository

    repo = InfluenceRepository(session)
    fused_repo = FusedRecordRepository(session)

    # 1. Fetch historical fused records
    fused_records = await fused_repo.get_by_ueid(ueid, limit=500)

    # 2. Extract Data for Influence
    total_flow = 0.0
    founders_count = 1

    for record in fused_records:
        if "customs" in record.source.lower():
            total_flow += float(record.normalized_data.get("value_usd", 0))
        elif "edr" in record.source.lower():
            data = record.normalized_data
            founders_count = len(data.get("founders", [])) or 1
            activities = data.get("activities", [])
            if activities:
                activities[0]

    # 3. Derive Indices
    # Market Share (simplified: entity flow vs conservative 1B market)
    market_share = min(1.0, total_flow / 1_000_000_000.0)

    # HHI (Herfindahl-Hirschman Index) estimate from founders
    # If 1 founder = 10000, 2 founders = 5000, etc. (assuming equal split for now)
    hhi_ben = 10000.0 / founders_count
    hhi_form = hhi_ben

    # Graph Centralities (Mock these for now but keep them stable)
    eigenvector = 0.1 + (total_flow / 10_000_000.0)
    betweenness = 0.05 + (market_share * 0.5)

    shadow = 10.0 if founders_count > 5 else 5.0
    data_comp = min(1.0, (len(fused_records) / 15.0) + 0.3) if fused_records else 0.3

    score = compute_influence_score(
        ueid,
        eigenvector=min(1.0, eigenvector),
        betweenness=min(1.0, betweenness),
        market_share=market_share,
        regulatory_proximity=0.1, # Default
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
        confidence=score.confidence.total,
        summary=f"Вплив оновлено: IM={score.im:.1f}, HCI={score.hci:.1f}, Founders={founders_count}",
        metadata={
            "im": score.im,
            "hci": score.hci,
            "shadow_cluster": score.shadow_cluster_score,
            "founders_count": founders_count,
            "market_share_est": market_share
        }
    )
    await bus.emit(signal, session=session)

    logger.info("Influence Engine processed ueid=%s, agg=%.1f, founders=%d", ueid, score.aggregate, founders_count)
    return score
