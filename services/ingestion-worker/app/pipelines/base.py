"""Base Pipeline — PREDATOR Analytics v61.0-ELITE Ironclad.

Abstract base class for all ingestion pipelines.
"""
from abc import ABC, abstractmethod
from typing import Any

from predator_common.logging import get_logger

logger = get_logger("ingestion_worker.pipeline")

class BasePipeline(ABC):
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id

    @abstractmethod
    async def run(self, source_data: Any) -> dict[str, Any]:
        """Запуск пайплайну."""
        pass

    async def validate(self, data: Any) -> bool:
        """Базова валідація."""
        return True

    async def normalize(self, data: Any) -> Any:
        """Нормалізація даних."""
        return data

    @abstractmethod
    async def save(self, data: Any) -> None:
        """Збереження результатів."""
        pass
