"""Predator v55.0 — Behavioral Engine.

Analyzes entity "character": reaction patterns, volatility, risk appetite.
Computes: BVI, ASS, CP, Inertia Index.

Input: declaration history, EDR data, tax records.
Output: BehavioralScore per UEID.
"""

from __future__ import annotations

from dataclasses import dataclass
import logging

from app.core.confidence import ConfidenceScore, quick_confidence
from app.indices.ass import calculate_ass
from app.indices.bvi import calculate_bvi
from app.indices.cp import calculate_cp


logger = logging.getLogger("predator.engines.behavioral")


@dataclass
class BehavioralScore:
    """Aggregated behavioral metrics for one entity."""

    ueid: str
    bvi: float
    ass: float
    cp: float
    inertia_index: float
    aggregate: float
    confidence: ConfidenceScore


def compute_behavioral_score(
    ueid: str,
    intervals: list[float],
    regions: list[str],
    brokers: list[str],
    prices: list[float],
    delta_t_regulation: float = 180.0,
    tax_gap: float = 0.0,
    broker_shift: float = 0.0,
    decline_trend: float = 0.0,
    data_completeness: float = 0.5,
) -> BehavioralScore:
    """Compute full behavioral score for an entity.

    Args:
        ueid: Entity UEID.
        intervals: Time intervals between declarations (days).
        regions: Customs regions used.
        brokers: Broker identifiers.
        prices: Declared prices.
        delta_t_regulation: Days to adapt to regulation changes.
        tax_gap: Tax gap percentage.
        broker_shift: Broker change frequency.
        decline_trend: Revenue decline trend.
        data_completeness: How complete the input data is (0-1).

    Returns:
        BehavioralScore with all metrics.
    """
    bvi = calculate_bvi(intervals, regions, brokers, prices)
    ass = calculate_ass(delta_t_regulation)
    cp = calculate_cp(bvi, tax_gap, broker_shift, decline_trend)

    # Inertia Index: inverse of BVI (stable entities have high inertia)
    inertia = max(0.0, 100.0 - bvi)

    # Aggregate: weighted combination
    aggregate = 0.40 * bvi + 0.20 * (100.0 - ass) + 0.30 * cp + 0.10 * (100.0 - inertia)
    aggregate = round(max(0.0, min(100.0, aggregate)), 2)

    confidence = quick_confidence(data_completeness)

    logger.info(
        "Behavioral score computed: ueid=%s bvi=%.1f ass=%.1f cp=%.1f agg=%.1f conf=%.2f",
        ueid,
        bvi,
        ass,
        cp,
        aggregate,
        confidence.total,
    )

    return BehavioralScore(
        ueid=ueid,
        bvi=bvi,
        ass=ass,
        cp=cp,
        inertia_index=round(inertia, 2),
        aggregate=aggregate,
        confidence=confidence,
    )
