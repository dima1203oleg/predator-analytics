from abc import ABC, abstractmethod
from dataclasses import dataclass
from enum import StrEnum
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from collections.abc import AsyncGenerator


class SourceType(StrEnum):
    EXCEL = "excel"
    CSV = "csv"
    PDF = "pdf"
    DOCUMENT = "document"
    IMAGE = "image"
    TELEGRAM = "telegram"
    API = "api"
    WEBSITE = "website"
    AUDIO = "audio"
    VIDEO = "video"


@dataclass
class PipelineResult:
    source_type: SourceType
    records_count: int
    chunks: list[dict[str, Any]]
    metadata: dict[str, Any]
    errors: list[str]


class BasePipeline(ABC):
    """Base class for all ingestion pipelines."""

    source_type: SourceType

    @abstractmethod
    async def extract(self, source: Any) -> "AsyncGenerator[dict, None]":
        """Extract raw data from source."""

    @abstractmethod
    async def transform(self, data: dict) -> dict:
        """Transform raw data into unified format."""

    @abstractmethod
    async def validate(self, data: dict) -> bool:
        """Validate single record."""

    async def process(self, source: Any) -> PipelineResult:
        """Main processing flow."""
        records = []
        errors = []

        try:
            async for raw_data in self.extract(source):
                try:
                    if await self.validate(raw_data):
                        transformed = await self.transform(raw_data)
                        records.append(transformed)
                except Exception as e:
                    errors.append(f"Row error: {e!s}")
        except Exception as e:
            errors.append(f"Extraction error: {e!s}")

        return PipelineResult(
            source_type=self.source_type,
            records_count=len(records),
            chunks=records,  # In reality, chunks are created later
            metadata={},
            errors=errors,
        )
