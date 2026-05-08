"""Генерація Data Card та Model Card для артефактів."""

import pandas as pd
from typing import Dict, Any, List
import datetime
import uuid
import structlog

logger = structlog.get_logger("sde.cards")

class CardGenerator:
    """Генератор стандартизованих карток для датасетів та моделей."""

    @staticmethod
    def generate_data_card(
        dataset_name: str,
        domain: str,
        data: pd.DataFrame,
        generation_method: str,
        quality_metrics: Dict[str, Any],
        author: str = "PREDATOR Synthetic Engine"
    ) -> Dict[str, Any]:
        """Генерує Data Card для синтетичного датасету."""
        logger.info(f"Генерація Data Card для '{dataset_name}'")
        
        card = {
            "id": f"dc-{uuid.uuid4().hex[:8]}",
            "name": dataset_name,
            "domain": domain,
            "version": "1.0.0",
            "created_at": datetime.datetime.now(datetime.UTC).isoformat(),
            "author": author,
            "methodology": {
                "generator": generation_method,
                "is_synthetic": True
            },
            "dataset_statistics": {
                "num_rows": len(data),
                "num_columns": len(data.columns),
                "columns": list(data.columns),
                "memory_usage_mb": round(data.memory_usage(deep=True).sum() / (1024 * 1024), 2)
            },
            "quality_assessment": quality_metrics,
            "intended_use": [
                "Model training and fine-tuning",
                "System testing without privacy risks",
                "Anomaly detection baseline generation"
            ],
            "limitations": [
                "Synthetic data may not capture all real-world edge cases",
                "Not suitable for direct financial reporting"
            ]
        }
        return card

    @staticmethod
    def generate_model_card(
        model_name: str,
        task_type: str,
        metrics: Dict[str, Any],
        training_data_ref: str,
        hyperparameters: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Генерує Model Card для навченої на синтетиці моделі."""
        logger.info(f"Генерація Model Card для '{model_name}'")
        
        card = {
            "id": f"mc-{uuid.uuid4().hex[:8]}",
            "name": model_name,
            "task_type": task_type,
            "created_at": datetime.datetime.now(datetime.UTC).isoformat(),
            "training_details": {
                "training_data_card": training_data_ref,
                "data_type": "synthetic_or_hybrid",
                "hyperparameters": hyperparameters or {}
            },
            "performance_metrics": metrics,
            "ethical_considerations": {
                "privacy": "Trained on synthetic data, no real PII exposure",
                "bias": "Inherits biases from original seed data (if any)"
            }
        }
        return card
