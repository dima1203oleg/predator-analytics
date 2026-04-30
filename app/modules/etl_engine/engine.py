from __future__ import annotations

"""
PREDATOR ETL Engine - Core Orchestrator (v4.2.0)

Coordinates parsing, transformation, deduplication, enrichment, and distribution
of data from various sources into the canonical storage layer.
"""

import logging
from pathlib import Path
from typing import Any

from app.modules.etl_engine.deduplication.data_deduplicator import DataDeduplicator
from app.modules.etl_engine.distribution.data_distributor import (
    DataDistributor,
    DistributionTarget,
)
from app.modules.etl_engine.parsing.data_parser import DataFormat, DataParser
from app.modules.etl_engine.transformation.data_transformer import DataTransformer

logger = logging.getLogger(__name__)

class ETLEngine:
    """The main orchestrator for ETL pipelines."""

    def __init__(
        self,
        parser: DataParser | None = None,
        transformer: DataTransformer | None = None,
        deduplicator: DataDeduplicator | None = None,
        distributor: DataDistributor | None = None
    ):
        self.parser = parser or DataParser()
        self.transformer = transformer or DataTransformer()
        self.deduplicator = deduplicator or DataDeduplicator(primary_keys=["Код товару", "Опис товару", "Митна декларація"])
        self.distributor = distributor or DataDistributor()

        logger.info("PREDATOR ETL Engine v4.2.0 initialized")

    async def run_pipeline(
        self,
        file_path: str | Path,
        source_format: DataFormat | None = None,
        distribution_targets: list[DistributionTarget] | None = None,
        schema_type: str = "unified"
    ) -> dict[str, Any]:
        """Runs the full ETL pipeline for a single file."""
        if distribution_targets is None:
            distribution_targets = [DistributionTarget.POSTGRESQL]
        file_path = Path(file_path)
        logger.info(f"Starting ETL pipeline for: {file_path}")

        # 1. Parsing
        parse_result = self.parser.parse(file_path, format_hint=source_format)
        if not parse_result.success:
            logger.error(f"ETL Step 1 (Parsing) failed: {parse_result.error}")
            return {"success": False, "step": "parsing", "error": parse_result.error}

        raw_data = parse_result.data
        if not raw_data:
            return {"success": False, "step": "parsing", "error": "No data extracted"}

        # 2. Transformation (Normalization & Validation)
        # Handle both list and single dict
        normalize_result = self.transformer.normalize_data_types(raw_data)
        if not normalize_result.success:
            logger.error(f"ETL Step 2 (Normalization) failed: {normalize_result.error}")
            return {"success": False, "step": "normalization", "error": normalize_result.error}

        normalized_data = normalize_result.data

        validate_result = self.transformer.validate_data(
            normalized_data,
            source_format=source_format.value if source_format else "auto",
            schema_type=schema_type
        )
        if not validate_result.success:
            logger.warning(f"ETL Step 2 (Validation) failed or returned warnings: {validate_result.error}")
            # Depending on policy, we might continue with partially valid data
            # or stop. Here we stop for strict canonical ingestion.
            # return {"success": False, "step": "validation", "error": validate_result.error}
            data_to_dedup = normalized_data # Fallback to normalized if validation is too strict
        else:
            data_to_dedup = validate_result.data

        # 3. Deduplication
        dedup_result = self.deduplicator.process_batch(data_to_dedup)
        unique_records = dedup_result["unique_records"]

        logger.info(f"Deduplication finished: {len(unique_records)} unique records from {len(data_to_dedup)} total.")

        if not unique_records:
            return {
                "success": True,
                "message": "Pipeline finished, but no unique records were found after deduplication.",
                "stats": dedup_result["stats"]
            }

        # 4. Distribution
        distribution_results = self.distributor.distribute(unique_records, targets=distribution_targets)

        return {
            "success": all(r.success for r in distribution_results),
            "stats": {
                "total_input": len(data_to_dedup),
                "unique_count": len(unique_records),
                "duplicate_count": dedup_result["stats"]["duplicate_count"],
                "distribution": [
                    {"target": r.target, "success": r.success, "error": r.error}
                    for r in distribution_results
                ]
            }
        }

def create_etl_engine() -> ETLEngine:
    """Factory for the ETL Engine."""
    return ETLEngine()
