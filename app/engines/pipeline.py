"""Predator v55.0 — Pipeline Orchestrator.

End-to-end data processing pipeline:
    Ingestion → Data Fusion → Behavioral Engine → CERS Meta-Scoring

Triggered via API or scheduled tasks. All steps use real DB persistence.
"""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any

from app.engines.data_fusion import DataSource, FusionResult, process_batch

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger("predator.pipeline")


async def run_full_pipeline(
    db: AsyncSession,
    records: list[dict[str, Any]],
    source: str,
    entity_type: str = "company",
) -> dict[str, Any]:
    """Run the complete analytical pipeline for a batch of raw records.

    Steps:
        1. Data Fusion: normalize, resolve entities, persist FusedRecords
        2. Behavioral Engine: compute BVI/ASS/CP for each unique entity
        3. CERS Meta-Scoring: compute composite risk score for each entity

    Args:
        db: Async database session.
        records: Raw data records from the source.
        source: Data source type (customs, tax, edr, etc.)
        entity_type: Entity type for resolution (default: company).

    Returns:
        Pipeline execution summary.

    """
    from app.engines.behavioral import process_entity as behavioral_process
    from app.engines.cers import process_entity as cers_process
    from app.engines.influence import process_entity as influence_process
    from app.engines.institutional import process_entity as institutional_process
    from app.engines.predictive import process_entity as predictive_process
    from app.engines.structural_gaps import process_entity as structural_process

    # ─── Step 1: Data Fusion ───
    logger.info("Pipeline Step 1/7: Data Fusion — %d records from [%s]", len(records), source)

    data_source = (
        DataSource(source) if source in DataSource.__members__.values() else DataSource.CUSTOMS
    )
    fusion_result: FusionResult = await process_batch(
        session=db,
        records=records,
        source=data_source,
        entity_type=entity_type,
    )

    logger.info(
        "Fusion done: processed=%d resolved=%d created=%d errors=%d",
        fusion_result.records_processed,
        fusion_result.entities_resolved,
        fusion_result.entities_created,
        len(fusion_result.errors),
    )

    # Collect unique UEIDs from fused records
    unique_ueids = list({r.ueid for r in fusion_result.records_fused if r.ueid})

    # ─── Step 2: Behavioral Scoring ───
    logger.info("Pipeline Step 2/7: Behavioral Engine — %d entities", len(unique_ueids))
    behavioral_results = {}
    for ueid in unique_ueids:
        try:
            await behavioral_process(ueid, db)
            behavioral_results[ueid] = "success"
        except Exception:
            logger.exception("Behavioral scoring failed for ueid=%s", ueid)

    # ─── Step 3: Institutional Scoring ───
    logger.info("Pipeline Step 3/7: Institutional Engine — %d entities", len(unique_ueids))
    institutional_results = {}
    for ueid in unique_ueids:
        try:
            await institutional_process(ueid, db)
            institutional_results[ueid] = "success"
        except Exception:
            logger.exception("Institutional scoring failed for ueid=%s", ueid)

    # ─── Step 4: Influence Scoring ───
    logger.info("Pipeline Step 4/7: Influence Engine — %d entities", len(unique_ueids))
    influence_results = {}
    for ueid in unique_ueids:
        try:
            await influence_process(ueid, db)
            influence_results[ueid] = "success"
        except Exception:
            logger.exception("Influence scoring failed for ueid=%s", ueid)

    # ─── Step 5: Structural Gaps ───
    logger.info("Pipeline Step 5/7: Structural Gaps — %d entities", len(unique_ueids))
    structural_results = {}
    for ueid in unique_ueids:
        try:
            await structural_process(ueid, db)
            structural_results[ueid] = "success"
        except Exception:
            logger.exception("Structural scoring failed for ueid=%s", ueid)

    # ─── Step 6: Predictive Engine ───
    logger.info("Pipeline Step 6/7: Predictive Engine — %d entities", len(unique_ueids))
    predictive_results = {}
    for ueid in unique_ueids:
        try:
            await predictive_process(ueid, db)
            predictive_results[ueid] = "success"
        except Exception:
            logger.exception("Predictive scoring failed for ueid=%s", ueid)

    # ─── Step 7: CERS Meta-Scoring ───
    logger.info("Pipeline Step 7/7: CERS Engine — %d entities", len(unique_ueids))

    cers_results = {}
    cers_errors = []
    for ueid in unique_ueids:
        try:
            cers = await cers_process(ueid, db)
            cers_results[ueid] = {
                "score": cers.score,
                "level": cers.level,
                "level_ua": cers.level_ua,
            }
        except Exception as e:
            logger.exception("CERS scoring failed for ueid=%s", ueid)
            cers_errors.append({"ueid": ueid, "error": str(e)})

    logger.info(
        "CERS done: scored=%d errors=%d",
        len(cers_results),
        len(cers_errors),
    )

    # ─── Summary ───
    summary = {
        "pipeline": "predator_v55_full",
        "source": source,
        "steps": {
            "fusion": {
                "records_processed": fusion_result.records_processed,
                "entities_resolved": fusion_result.entities_resolved,
                "entities_created": fusion_result.entities_created,
                "errors": fusion_result.errors[:10],
            },
            "engines": {
                "behavioral": len(behavioral_results),
                "institutional": len(institutional_results),
                "influence": len(influence_results),
                "structural": len(structural_results),
                "predictive": len(predictive_results),
            },
            "cers": {
                "entities_scored": len(cers_results),
                "errors": cers_errors[:10],
            },
        },
        "unique_entities": len(unique_ueids),
    }

    logger.info(
        "Pipeline complete: %d records → %d entities → %d CERS",
        fusion_result.records_processed,
        len(unique_ueids),
        len(cers_results),
    )

    return summary
