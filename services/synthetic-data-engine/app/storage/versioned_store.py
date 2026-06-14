"""Зберігання датасетів та артефактів."""

from typing import Any
import os
import json
import pandas as pd
import structlog

logger = structlog.get_logger("sde.storage")

class VersionedDatasetStore:
    """Зберігання датасетів та їх карток."""

    def __init__(self, bucket_name: str = "synthetic-datasets"):
        self.bucket_name = bucket_name
        self.cards_bucket = "data-cards"
        self.base_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
        os.makedirs(os.path.join(self.base_dir, self.bucket_name), exist_ok=True)
        os.makedirs(os.path.join(self.base_dir, self.cards_bucket), exist_ok=True)
        os.makedirs(os.path.join(self.base_dir, "model-cards"), exist_ok=True)

    async def save_dataset(self, name: str, data: pd.DataFrame, metadata: dict[str, Any] = None) -> str:
        """Зберігає DataFrame як parquet."""
        logger.info(f"Збереження датасету {name} в {self.bucket_name}")

        object_path = os.path.join(self.base_dir, self.bucket_name, f"{name}.parquet")
        data.to_parquet(object_path)
        return object_path

    async def save_card(self, card_data: dict[str, Any], is_model_card: bool = False) -> str:
        """Зберігає Data/Model Card."""
        bucket = "model-cards" if is_model_card else self.cards_bucket
        card_id = card_data["id"]

        logger.info(f"Збереження картки {card_id} в {bucket}")

        object_path = os.path.join(self.base_dir, bucket, f"{card_id}.json")
        with open(object_path, "w", encoding="utf-8") as f:
            json.dump(card_data, f, indent=2, ensure_ascii=False)

        return object_path

    async def load_dataset(self, path: str) -> pd.DataFrame:
        """Завантажує датасет."""
        logger.info(f"Завантаження датасету {path}")
        return pd.read_parquet(path)
