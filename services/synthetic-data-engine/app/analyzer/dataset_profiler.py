"""Профілювання датасетів для Synthetic Data Engine.
Аналізує структуру даних, розподіли та залежності.
"""

import pandas as pd
import numpy as np
from typing import Any, Dict, List
import structlog

logger = structlog.get_logger("sde.profiler")

class DatasetProfiler:
    """Профілювальник даних для визначення оптимального генератора."""

    @staticmethod
    def profile(df: pd.DataFrame) -> Dict[str, Any]:
        """Повний аналіз DataFrame."""
        logger.info("Профілювання датасету", shape=df.shape)
        
        # Визначення типів колонок
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        categorical_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()
        datetime_cols = df.select_dtypes(include=['datetime64']).columns.tolist()
        
        # Додатковий аналіз категоріальних
        high_cardinality = []
        for col in categorical_cols:
            if df[col].nunique() > 50: # Magic number, можна винести в config
                high_cardinality.append(col)
                
        # Аналіз пропусків
        missing_stats = df.isnull().sum().to_dict()
        has_missing = any(v > 0 for v in missing_stats.values())
        
        # Рекомендація генератора
        recommended_generator = DatasetProfiler._recommend_generator(
            len(df), has_missing, len(categorical_cols), len(high_cardinality)
        )
        
        return {
            "num_rows": len(df),
            "num_columns": len(df.columns),
            "columns": df.columns.tolist(),
            "numeric_cols": numeric_cols,
            "categorical_cols": categorical_cols,
            "datetime_cols": datetime_cols,
            "high_cardinality_cols": high_cardinality,
            "missing_stats": missing_stats,
            "recommended_generator": recommended_generator
        }

    @staticmethod
    def _recommend_generator(rows: int, has_missing: bool, num_categorical: int, high_cardinality: int) -> str:
        """Рекомендує найкращий метод генерації."""
        if high_cardinality > 0:
            return "CTGAN" # Краще справляється з високою кардинальністю
        if has_missing:
            return "TVAE" # Краще моделює пропуски
        if rows < 1000:
            return "GaussianCopula" # Швидко на малих даних, менше ризик перенавчання
        return "CTGAN"
