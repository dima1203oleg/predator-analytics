"""Model Storage — збереження і завантаження моделей та артефактів в MinIO.

PREDATOR Analytics v56.5-ELITE
"""
import io
import json
from typing import Any, Optional

import pandas as pd
from minio import Minio
from minio.error import S3Error
import structlog

logger = structlog.get_logger("predator_common.ml.storage")

class MLModelStorage:
    """Клас для роботи з артефактами ML у MinIO."""

    def __init__(self, endpoint: str, access_key: str, secret_key: str, secure: bool = False):
        self.client = Minio(
            endpoint,
            access_key=access_key,
            secret_key=secret_key,
            secure=secure
        )
        self.connected = False
        try:
            self.client.list_buckets()
            self.connected = True
        except Exception as e:
            logger.warning(f"MLModelStorage: MinIO недоступний: {e}")

    def _ensure_bucket(self, bucket: str):
        if self.connected:
            try:
                if not self.client.bucket_exists(bucket):
                    self.client.make_bucket(bucket)
            except S3Error as e:
                logger.error(f"Помилка перевірки/створення бакету {bucket}: {e}")

    def save_parquet(self, bucket: str, object_name: str, df: pd.DataFrame) -> str:
        """Зберігає DataFrame як Parquet файл у MinIO."""
        if not self.connected:
            raise ConnectionError("MinIO не підключено")
            
        self._ensure_bucket(bucket)
        
        buffer = io.BytesIO()
        df.to_parquet(buffer, index=False)
        buffer.seek(0)
        
        try:
            self.client.put_object(
                bucket,
                object_name,
                data=buffer,
                length=buffer.getbuffer().nbytes,
                content_type="application/octet-stream"
            )
            return f"s3://{bucket}/{object_name}"
        except S3Error as e:
            logger.error(f"Помилка збереження Parquet {object_name}: {e}")
            raise

    def load_parquet(self, bucket: str, object_name: str) -> pd.DataFrame:
        """Завантажує Parquet файл з MinIO у DataFrame."""
        if not self.connected:
            raise ConnectionError("MinIO не підключено")
            
        try:
            response = self.client.get_object(bucket, object_name)
            data = response.read()
            response.close()
            response.release_conn()
            
            buffer = io.BytesIO(data)
            return pd.read_parquet(buffer)
        except S3Error as e:
            logger.error(f"Помилка завантаження Parquet {object_name}: {e}")
            raise

    def save_json(self, bucket: str, object_name: str, data: dict[str, Any]) -> str:
        """Зберігає JSON документ (напр., Model Card) у MinIO."""
        if not self.connected:
            raise ConnectionError("MinIO не підключено")
            
        self._ensure_bucket(bucket)
        
        content = json.dumps(data, indent=2, ensure_ascii=False).encode("utf-8")
        buffer = io.BytesIO(content)
        
        try:
            self.client.put_object(
                bucket,
                object_name,
                data=buffer,
                length=len(content),
                content_type="application/json"
            )
            return f"s3://{bucket}/{object_name}"
        except S3Error as e:
            logger.error(f"Помилка збереження JSON {object_name}: {e}")
            raise

    def load_json(self, bucket: str, object_name: str) -> dict[str, Any]:
        """Завантажує JSON документ з MinIO."""
        if not self.connected:
            raise ConnectionError("MinIO не підключено")
            
        try:
            response = self.client.get_object(bucket, object_name)
            data = response.read().decode("utf-8")
            response.close()
            response.release_conn()
            return json.loads(data)
        except S3Error as e:
            logger.error(f"Помилка завантаження JSON {object_name}: {e}")
            raise
