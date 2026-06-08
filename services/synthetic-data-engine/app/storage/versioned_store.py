"""Зберігання датасетів та артефактів."""

from typing import Any

import pandas as pd
import structlog

logger = structlog.get_logger("sde.storage")

# В реальності це імпорт з core-api
# from app.services.minio_service import minio_service

class VersionedDatasetStore:
    """Зберігання датасетів та їх карток у MinIO."""

    def __init__(self, bucket_name: str = "synthetic-datasets"):
        self.bucket_name = bucket_name
        self.cards_bucket = "data-cards"

    async def save_dataset(self, name: str, data: pd.DataFrame, metadata: dict[str, Any] = None) -> str:
        """Зберігає DataFrame у MinIO як parquet."""
        logger.info(f"Збереження датасету {name} в {self.bucket_name}")

        # MOCK РЕАЛІЗАЦІЯ ДЛЯ ТЕСТУВАННЯ
        # buffer = io.BytesIO()
        # data.to_parquet(buffer)
        # buffer.seek(0)
        #
        # object_name = f"{name}.parquet"
        # await minio_service.upload_file(
        #     bucket=self.bucket_name,
        #     object_name=object_name,
        #     data=buffer,
        #     length=buffer.getbuffer().nbytes,
        #     content_type="application/octet-stream",
        #     metadata=metadata
        # )

        object_path = f"s3://{self.bucket_name}/{name}.parquet"
        return object_path

    async def save_card(self, card_data: dict[str, Any], is_model_card: bool = False) -> str:
        """Зберігає Data/Model Card у MinIO."""
        bucket = "model-cards" if is_model_card else self.cards_bucket
        card_id = card_data["id"]

        logger.info(f"Збереження картки {card_id} в {bucket}")

        # MOCK РЕАЛІЗАЦІЯ
        # content = json.dumps(card_data, indent=2).encode('utf-8')
        # await minio_service.upload_file(
        #     bucket=bucket,
        #     object_name=f"{card_id}.json",
        #     data=io.BytesIO(content),
        #     length=len(content),
        #     content_type="application/json"
        # )

        return f"s3://{bucket}/{card_id}.json"

    async def load_dataset(self, path: str) -> pd.DataFrame:
        """Завантажує датасет з MinIO."""
        logger.info(f"Завантаження датасету {path}")
        # MOCK: в реальності треба завантажити байти з MinIO і прочитати через pd.read_parquet
        raise NotImplementedError("MOCK: load_dataset requires actual MinIO connection")
