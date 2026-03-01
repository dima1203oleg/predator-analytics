"""Predator v55.0 — Institutional Engine.

Analyzes the environment: customs processing, regulatory patterns, institutional biases.
Computes: AAI, PLS, RDI (Regional Divergence Index), RSI (Regulatory Shift Index).

Input: declaration processing times, staff changes, permit registries.
Output: InstitutionalScore per region/entity.
"""

from __future__ import annotations

from dataclasses import dataclass
import logging

from app.core.confidence import ConfidenceScore, quick_confidence
from app.indices.aai import calculate_aai
from app.indices.pls import calculate_pls


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
