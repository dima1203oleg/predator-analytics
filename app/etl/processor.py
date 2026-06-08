from __future__ import annotations

"""ETL Processor - Data transformation pipeline."""
from dataclasses import dataclass
import logging
from typing import Any, Protocol

logger = logging.getLogger(__name__)


@dataclass
class ProcessorResult:
    success: bool
    records_processed: int
    records_failed: int
    errors: list[str]


class Transformer(Protocol):
    """Protocol for ETL transformers."""

    async def transform(self, record: dict[str, Any]) -> dict[str, Any]:
        ...


class NormalizationTransform:
    """Normalize fields like dates, strings."""

    async def transform(self, record: dict[str, Any]) -> dict[str, Any]:
        # Basic normalization logic
        for key, value in list(record.items()):
            if isinstance(value, str):
                record[key] = value.strip()
        return record


class EnrichmentTransform:
    """Enrich records with additional metadata."""

    async def transform(self, record: dict[str, Any]) -> dict[str, Any]:
        if "metadata" not in record:
            record["metadata"] = {}
        record["metadata"]["processed_by"] = "etl_v67"
        return record


class ETLProcessor:
    """ETL data processor."""

    def __init__(self):
        self.pipelines: dict[str, list[Transformer]] = {
            "default": [NormalizationTransform(), EnrichmentTransform()],
            "excel": [NormalizationTransform(), EnrichmentTransform()],
            "csv": [NormalizationTransform(), EnrichmentTransform()],
            "telegram": [NormalizationTransform(), EnrichmentTransform()]
        }

    async def process(self, data: list[dict], pipeline: str = "default") -> ProcessorResult:
        """Process data through pipeline."""
        processed = 0
        failed = 0
        errors = []

        transformers = self.pipelines.get(pipeline, self.pipelines["default"])

        for record in data:
            try:
                for transformer in transformers:
                    record = await transformer.transform(record)
                processed += 1
            except Exception as e:
                failed += 1
                errors.append(str(e))

        return ProcessorResult(
            success=failed == 0,
            records_processed=processed,
            records_failed=failed,
            errors=errors[:10],
        )

    async def _transform(self, record: dict, pipeline: str) -> dict:
        """Transform single record."""
        transformers = self.pipelines.get(pipeline, self.pipelines["default"])
        for transformer in transformers:
            record = await transformer.transform(record)
        return record


etl_processor = ETLProcessor()
