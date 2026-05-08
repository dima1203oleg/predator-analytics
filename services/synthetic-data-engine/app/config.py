"""Конфігурація Synthetic Data Engine."""

from typing import Any
from pydantic_settings import BaseSettings, SettingsConfigDict


class SyntheticEngineConfig(BaseSettings):
    """Конфігурація для генерації синтетичних даних."""

    # Режими роботи
    ENABLE_SDV: bool = True           # Вимкнути на Kaggle якщо проблеми з RAM (Fallback на GaussianCopula)
    ENABLE_LLM_GENERATOR: bool = True # Використання LLM для Zero-Shot

    # Обмеження генерації (щоб не покласти пам'ять)
    MAX_ROWS_PER_BATCH: int = 10000
    MAX_COLUMNS: int = 500
    MAX_CATEGORICAL_UNIQUE: int = 50

    # Якість
    MIN_QUALITY_SCORE_SDV: float = 0.70  # Мінімальний скор якості від SDV
    KS_TEST_PVALUE_THRESHOLD: float = 0.05 # Для Kolmogorov-Smirnov тесту

    # Шляхи (MinIO)
    DATASET_BUCKET: str = "synthetic-datasets"
    MODEL_CARD_BUCKET: str = "model-cards"

    # LLM Generator settings
    LLM_BATCH_SIZE: int = 20
    LLM_MAX_RETRIES: int = 3
    LLM_TEMPERATURE: float = 0.7

    model_config = SettingsConfigDict(
        env_prefix="SDE_",
        case_sensitive=True,
        extra="ignore"
    )

config = SyntheticEngineConfig()
