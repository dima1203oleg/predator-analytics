"""Базові класи для генераторів синтетичних даних."""

import pandas as pd
from typing import Any, Dict, Optional
from abc import ABC, abstractmethod
import structlog

logger = structlog.get_logger("sde.generators")

class BaseSyntheticGenerator(ABC):
    """Абстрактний клас генератора."""

    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.is_fitted = False
        self.metadata = None

    @abstractmethod
    def fit(self, data: pd.DataFrame, metadata: Optional[Dict[str, Any]] = None) -> None:
        """Навчання генератора на реальних даних."""
        pass

    @abstractmethod
    def sample(self, num_rows: int) -> pd.DataFrame:
        """Генерація синтетичних даних."""
        pass
        
    def evaluate(self, real_data: pd.DataFrame, synthetic_data: pd.DataFrame) -> Dict[str, float]:
        """Оцінка якості згенерованих даних (перевизначається в нащадках)."""
        logger.warning("Оцінка якості не реалізована для цього генератора")
        return {"overall_quality": 0.0}
