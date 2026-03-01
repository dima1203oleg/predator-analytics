"""Predator v55.0 — Structural Gaps Engine.

Detects "holes" in the economy — things that should exist but don't.
Computes: MCI, PFI, TDI (Trade Discrepancy Index), LGS (Logistics Gap Score).

Input: import/export data, production, consumption, transport.
Output: StructuralScore per sector/entity.
"""

from __future__ import annotations

from dataclasses import dataclass
import logging

from app.core.confidence import ConfidenceScore, quick_confidence
from app.indices.mci import calculate_mci_normalized
from app.indices.pfi import calculate_pfi_normalized


logger = logging.getLogger("predator.engines.structural_gaps")


@dataclass
class StructuralScore:
    """Aggregated structural gap metrics."""

    ueid: str
    mci: float
    pfi: float
    tdi: float
    lgs: float
    aggregate: float
    confidence: ConfidenceScore


def compute_structural_score(
    ueid: str,
    import_volume: float,
    production: float,
    domestic_sales: float,
    export_volume: float,
    inventory_change: float,
    total_market_volume: float = 1.0,
    trade_discrepancy: float = 0.0,
    logistics_gap: float = 0.0,
    data_completeness: float = 0.5,
) -> StructuralScore:
    """Compute structural gap score for an entity/sector.

    Args:
        ueid: Entity or sector UEID.
        import_volume: Total imports.
        production: Domestic production.
        domestic_sales: Domestic sales.
        export_volume: Exports.
        inventory_change: Change in inventory.
        total_market_volume: Total market volume for normalization.
        trade_discrepancy: Pre-computed trade discrepancy index (0-100).
        logistics_gap: Pre-computed logistics gap score (0-100).
        data_completeness: Data completeness factor (0-1).

    Returns:
        StructuralScore with all metrics.
    """
    mci = calculate_mci_normalized(
        import_volume,
        production,
        domestic_sales,
        export_volume,
        inventory_change,
        total_market_volume,
    )
    pfi = calculate_pfi_normalized(
        import_volume,
        domestic_sales,
        export_volume,
        inventory_change,
    )

    aggregate = 0.30 * mci + 0.30 * pfi + 0.20 * trade_discrepancy + 0.20 * logistics_gap
    aggregate = round(max(0.0, min(100.0, aggregate)), 2)

    confidence = quick_confidence(data_completeness)

    logger.info(
        "Structural score computed: ueid=%s mci=%.1f pfi=%.1f agg=%.1f",
        ueid,
        mci,
        pfi,
        aggregate,
    )

    return StructuralScore(
        ueid=ueid,
        mci=mci,
        pfi=pfi,
        tdi=round(trade_discrepancy, 2),
        lgs=round(logistics_gap, 2),
        aggregate=aggregate,
        confidence=confidence,
    )
