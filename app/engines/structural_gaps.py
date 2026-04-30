"""Predator v55.0 — Structural Gaps Engine.

Detects "holes" in the economy — things that should exist but don't.
Computes: MCI, PFI, TDI (Trade Discrepancy Index), LGS (Logistics Gap Score).

Input: import/export data, production, consumption, transport.
Output: StructuralScore per sector/entity.
"""

from __future__ import annotations

from dataclasses import dataclass
import logging
from typing import TYPE_CHECKING

from app.core.confidence import ConfidenceScore, quick_confidence
from app.core.signal_bus import SignalBus
from app.indices.mci import calculate_mci_normalized
from app.indices.pfi import calculate_pfi_normalized
from app.models.v55.signal import SignalLayer, SignalPriority, V55Signal

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

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


async def process_entity(ueid: str, session: AsyncSession) -> StructuralScore:
    """Run Structural Gaps Analysis for a specific entity.
    Features async DB persistence and real-time scaling out via SignalBus.
    """
    from app.repositories.fused_record_repository import FusedRecordRepository
    from app.repositories.structural_repository import StructuralRepository

    repo = StructuralRepository(session)
    fused_repo = FusedRecordRepository(session)

    # 1. Fetch historical fused records
    fused_records = await fused_repo.get_by_ueid(ueid, limit=500)

    # 2. Extract Volumes
    imports = 0.0
    domestic_sales = 0.0
    production = 0.0 # Often requires industrial production data
    exports = 0.0
    inventory = 0.0

    for record in fused_records:
        data = record.normalized_data
        if "customs" in record.source.lower():
            imports += float(data.get("value_usd", 0))
        elif "tax" in record.source.lower():
            # Assuming if they are the seller, it's domestic sales
            domestic_sales += float(data.get("amount", 0))

    # Estimate market volume as total activity
    market = max(1000.0, imports + domestic_sales)

    # 3. Stable Fallbacks for Trade/Logistics discrepancies
    t_diff = 15.0 if imports > 0 and domestic_sales > 0 else 45.0
    l_gap = 20.0 if imports > 100000 else 10.0

    data_comp = min(1.0, (len(fused_records) / 25.0) + 0.1) if fused_records else 0.2

    score = compute_structural_score(
        ueid,
        import_volume=imports,
        production=production,
        domestic_sales=domestic_sales,
        export_volume=exports,
        inventory_change=inventory,
        total_market_volume=market,
        trade_discrepancy=t_diff,
        logistics_gap=l_gap,
        data_completeness=data_comp,
    )

    # 1. DB Persistence
    await repo.save_score(score)

    # 2. Emit Signal (v55 standard)
    bus = SignalBus.get_instance()

    signal = V55Signal(
        signal_type="STRUCTURAL_GAPS_SCORING",
        topic="structural_gaps.analyzed",
        ueid=ueid,
        layer=SignalLayer.STRUCTURAL,
        priority=SignalPriority.CRITICAL if score.aggregate > 80 else SignalPriority.HIGH if score.aggregate > 60 else SignalPriority.ROUTINE,
        score=score.aggregate,
        confidence=score.confidence.total,
        summary=f"Структурні аномалії: MCI={score.mci:.1f}, TDI={score.tdi:.1f}",
        metadata={
            "mci": score.mci,
            "pfi": score.pfi,
            "tdi": score.tdi,
            "lgs": score.lgs,
            "imports": imports,
            "domestic_sales": domestic_sales
        }
    )
    await bus.emit(signal, session=session)

    logger.info("Structural Gaps Engine processed ueid=%s, agg=%.1f", ueid, score.aggregate)
    return score
