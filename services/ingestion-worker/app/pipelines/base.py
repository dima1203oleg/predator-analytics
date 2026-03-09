"""
Base Pipeline — PREDATOR Analytics v55.1 Ironclad.

Abstract base class for all ingestion pipelines.
"""
from abc import ABC, abstractmethod
from typing import Any, Dict, List
from predator_common.logging import get_logger

logger = get_logger("ingestion_worker.pipeline")

class BasePipeline(ABC):
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id

    @abstractmethod
    async def run(self, source_data: Any) -> Dict[str, Any]:
        """Запуск пайплайну."""
        pass

    async def validate(self, data: Any) -> bool:
        """Базова валідація."""
        return True

    async def normalize(self, data: Any) -> Any:
        """Нормалізація даних."""
        return data

    async def save(self, data: Any):
        """Збереження результатів."""
        pass
