"""Статистичні генератори на базі Synthetic Data Vault (SDV)."""

import pandas as pd
from typing import Any, Dict, Optional
import structlog

# SDV imports
try:
    from sdv.metadata import SingleTableMetadata
    from sdv.single_table import GaussianCopulaSynthesizer, CTGANSynthesizer, TVAESynthesizer
    from sdv.evaluation.single_table import evaluate_quality
    SDV_AVAILABLE = True
except ImportError:
    SDV_AVAILABLE = False

from .base import BaseSyntheticGenerator

logger = structlog.get_logger("sde.generators.statistical")

class SDVGenerator(BaseSyntheticGenerator):
    """Базовий клас для генераторів на основі SDV."""

    def __init__(self, model_type: str = "copula", config: Dict[str, Any] = None):
        super().__init__(config)
        self.model_type = model_type.lower()
        self.synthesizer = None
        self.sdv_metadata = None
        
        if not SDV_AVAILABLE:
            raise ImportError("SDV library is not installed. Statistical generators require 'sdv'.")

    def _init_synthesizer(self):
        """Ініціалізація специфічного синтезатора."""
        if self.model_type == "copula":
            self.synthesizer = GaussianCopulaSynthesizer(self.sdv_metadata)
        elif self.model_type == "ctgan":
            # Можна додати гіперпараметри з config
            epochs = self.config.get("epochs", 300)
            self.synthesizer = CTGANSynthesizer(self.sdv_metadata, epochs=epochs)
        elif self.model_type == "tvae":
            epochs = self.config.get("epochs", 300)
            self.synthesizer = TVAESynthesizer(self.sdv_metadata, epochs=epochs)
        else:
            raise ValueError(f"Unknown SDV model type: {self.model_type}")

    def fit(self, data: pd.DataFrame, metadata: Optional[Dict[str, Any]] = None) -> None:
        """Навчання SDV моделі."""
        logger.info(f"Навчання SDV моделі: {self.model_type}")
        
        # 1. Створення SDV метаданих
        self.sdv_metadata = SingleTableMetadata()
        self.sdv_metadata.detect_from_dataframe(data)
        
        # 2. Оновлення метаданих згідно з переданими
        if metadata and "primary_key" in metadata:
            self.sdv_metadata.update_column(column_name=metadata["primary_key"], sdtype='id')
            self.sdv_metadata.set_primary_key(metadata["primary_key"])
            
        # 3. Ініціалізація та навчання
        self._init_synthesizer()
        self.synthesizer.fit(data)
        self.is_fitted = True
        logger.info(f"SDV модель {self.model_type} успішно навчена")

    def sample(self, num_rows: int) -> pd.DataFrame:
        """Генерація синтетичних даних."""
        if not self.is_fitted:
            raise RuntimeError("Синтезатор не навчено. Викличте fit() спочатку.")
            
        logger.info(f"Генерація {num_rows} записів через {self.model_type}")
        return self.synthesizer.sample(num_rows=num_rows)
        
    def evaluate(self, real_data: pd.DataFrame, synthetic_data: pd.DataFrame) -> Dict[str, float]:
        """Оцінка якості за допомогою SDV evaluation."""
        logger.info("Оцінка якості синтетичних даних")
        quality_report = evaluate_quality(
            real_data,
            synthetic_data,
            self.sdv_metadata
        )
        score = quality_report.get_score()
        return {
            "overall_quality": score,
            "column_shapes": quality_report.get_details(property_name='Column Shapes')['Quality Score'].mean(),
            "column_pair_trends": quality_report.get_details(property_name='Column Pair Trends')['Quality Score'].mean()
        }

class GaussianCopulaGenerator(SDVGenerator):
    def __init__(self, config: Dict[str, Any] = None):
        super().__init__("copula", config)

class CTGANGenerator(SDVGenerator):
    def __init__(self, config: Dict[str, Any] = None):
        super().__init__("ctgan", config)

class TVAEGenerator(SDVGenerator):
    def __init__(self, config: Dict[str, Any] = None):
        super().__init__("tvae", config)
