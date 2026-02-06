from abc import ABC, abstractmethod
from typing import AsyncGenerator, List, Dict, Any
from dataclasses import dataclass
from enum import Enum

class SourceType(str, Enum):
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
    chunks: List[Dict[str, Any]]
    metadata: Dict[str, Any]
    errors: List[str]

class BasePipeline(ABC):
    """
    Base class for all ingestion pipelines.
    """

    source_type: SourceType

    @abstractmethod
    async def extract(self, source: Any) -> AsyncGenerator[Dict, None]:
        """Extract raw data from source"""
        pass

    @abstractmethod
    async def transform(self, data: Dict) -> Dict:
        """Transform raw data into unified format"""
        pass

    @abstractmethod
    async def validate(self, data: Dict) -> bool:
        """Validate single record"""
        pass

    async def process(self, source: Any) -> PipelineResult:
        """Main processing flow"""
        records = []
        errors = []

        try:
            async for raw_data in self.extract(source):
                try:
                    if await self.validate(raw_data):
                        transformed = await self.transform(raw_data)
                        records.append(transformed)
                except Exception as e:
                    errors.append(f"Row error: {str(e)}")
        except Exception as e:
             errors.append(f"Extraction error: {str(e)}")

        return PipelineResult(
            source_type=self.source_type,
            records_count=len(records),
            chunks=records,  # In reality, chunks are created later
            metadata={},
            errors=errors
        )
