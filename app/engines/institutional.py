"""Predator v55.0 — Institutional Engine.

Analyzes the environment: customs processing, regulatory patterns, institutional biases.
Computes: AAI, PLS, RDI (Regional Divergence Index), RSI (Regulatory Shift Index).

Input: declaration processing times, staff changes, permit registries.
Output: InstitutionalScore per region/entity.
"""

from __future__ import annotations

from dataclasses import dataclass
import logging
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.confidence import ConfidenceScore, quick_confidence
from app.core.signal_bus import SignalBus
from app.indices.aai import calculate_aai
from app.indices.pls import calculate_pls
from app.models.v55.signal import SignalLayer, SignalPriority, V55Signal


logger = logging.getLogger("predator.engines.institutional")


@dataclass
class InstitutionalScore:
    """Aggregated institutional metrics."""

    ueid: str
    aai: float
    pls: float
    rdi: float
    rsi: float
    aggregate: float
    confidence: ConfidenceScore


def compute_institutional_score(
    ueid: str,
    avg_release_time_region: float,
    national_mean_release_time: float,
    company_flow_through_post: float,
    total_company_flow: float,
    regional_divergence: float = 0.0,
    regulatory_shift: float = 0.0,
    data_completeness: float = 0.5,
) -> InstitutionalScore:
    """Compute institutional score for an entity/region.

    Args:
        ueid: Entity or region UEID.
        avg_release_time_region: Average customs release time for the region (hours).
        national_mean_release_time: National average release time (hours).
        company_flow_through_post: Company's flow through its primary post.
        total_company_flow: Company's total flow across all posts.
        regional_divergence: Pre-computed regional divergence index (0-100).
        regulatory_shift: Pre-computed regulatory shift index (0-100).
        data_completeness: Data completeness factor (0-1).

    Returns:
        InstitutionalScore with all metrics.
    """
    aai = calculate_aai(avg_release_time_region, national_mean_release_time)
    pls = calculate_pls(company_flow_through_post, total_company_flow)

    aggregate = 0.35 * aai + 0.30 * pls + 0.20 * regional_divergence + 0.15 * regulatory_shift
    aggregate = round(max(0.0, min(100.0, aggregate)), 2)

    confidence = quick_confidence(data_completeness)

    logger.info(
        "Institutional score computed: ueid=%s aai=%.1f pls=%.1f agg=%.1f",
        ueid,
        aai,
        pls,
        aggregate,
    )

    return InstitutionalScore(
        ueid=ueid,
        aai=aai,
        pls=pls,
        rdi=round(regional_divergence, 2),
        rsi=round(regulatory_shift, 2),
        aggregate=aggregate,
        confidence=confidence,
    )


async def process_entity(ueid: str, session: AsyncSession) -> InstitutionalScore:
    """Run Institutional Analysis for a specific entity.
    Features async DB persistence and real-time scaling out via SignalBus.
    """
    from app.repositories.institutional_repository import InstitutionalRepository
    repo = InstitutionalRepository(session)
    
    # 🚨 PREDATOR LAZY LOADING / MOCKS
    # Temporarily generate semi-random metrics until full integration
    import random
    avg_release = random.uniform(1.0, 48.0)
    national_mean = 12.0
    company_flow = random.uniform(10, 500)
    total_flow = company_flow * random.uniform(1.0, 5.0)
    r_divergence = random.uniform(0.0, 100.0)
    r_shift = random.uniform(0.0, 100.0)
    data_comp = random.uniform(0.5, 1.0)

    score = compute_institutional_score(
        ueid,
        avg_release_time_region=avg_release,
        national_mean_release_time=national_mean,
        company_flow_through_post=company_flow,
        total_company_flow=total_flow,
        regional_divergence=r_divergence,
        regulatory_shift=r_shift,
        data_completeness=data_comp,
    )

    # 1. DB Persistence
    await repo.save_score(score)

    # 2. Emit Signal (v55 standard)
    bus = SignalBus.get_instance()
    signal = V55Signal(
        signal_type="INSTITUTIONAL_SCORING",
        topic="institutional.analyzed",
        ueid=ueid,
        layer=SignalLayer.INSTITUTIONAL,
        priority=SignalPriority.CRITICAL if score.aggregate > 80 else SignalPriority.HIGH if score.aggregate > 60 else SignalPriority.ROUTINE,
        score=score.aggregate,
        confidence=score.confidence.final_score,
        summary=f"Інституційний зріз: AAI={score.aai:.1f}, PLS={score.pls:.1f}",
        metadata={
            "aai": score.aai,
            "pls": score.pls,
            "rdi": score.rdi,
            "rsi": score.rsi
        }
    )
    # emit expects db session for persistence fallback
    await bus.emit(signal, session=session)

    logger.info("Institutional Engine processed ueid=%s, agg=%.1f", ueid, score.aggregate)
    return score
