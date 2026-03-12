"""MinIO Service — PREDATOR Analytics v55.1 Ironclad.

Сервіс для роботи з об'єктним сховищем MinIO/S3.
"""
import os
from typing import BinaryIO

from minio import Minio

from predator_common.logging import get_logger

logger = get_logger("ingestion_worker.minio")


class MinioService:
    """Клієнт для роботи з MinIO/S3."""

    def __init__(self) -> None:
        """Ініціалізація MinIO клієнта."""
        self.endpoint = os.getenv("MINIO_ENDPOINT", "localhost:9000")
        self.access_key = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
        self.secret_key = os.getenv("MINIO_SECRET_KEY", "minioadmin")
        self.secure = os.getenv("MINIO_SECURE", "false").lower() == "true"
        self.bucket_ingestion = os.getenv("MINIO_BUCKET_INGESTION", "raw-uploads")

        self.client = Minio(
            self.endpoint,
            access_key=self.access_key,
            secret_key=self.secret_key,
            secure=self.secure,
        )
        logger.info(f"MinIO client initialized: {self.endpoint}")

    def get_file_bytes(self, bucket_name: str, object_name: str) -> bytes:
        """Завантажує файл з MinIO як bytes."""
        logger.info(f"Downloading {object_name} from {bucket_name}")
        try:
            response = self.client.get_object(bucket_name, object_name)
            data = response.read()
            response.close()
            response.release_conn()
            return data
        except Exception as e:
            logger.error(f"Failed to get object {object_name}: {e}")
            raise

    def get_file_stream(self, bucket_name: str, object_name: str) -> BinaryIO:
        """Отримує файл з MinIO як стрім (для великих файлів)."""
        logger.info(f"Streaming {object_name} from {bucket_name}")
        try:
            response = self.client.get_object(bucket_name, object_name)
            return response
        except Exception as e:
            logger.error(f"Failed to stream object {object_name}: {e}")
            raise

    def parse_s3_path(self, s3_path: str) -> tuple[str, str]:
        """Парсить s3_path у bucket та object_name.

        Формат: bucket/tenant_id/job_id/filename.csv
        """
        parts = s3_path.split("/", 1)
        if len(parts) == 2:
            return parts[0], parts[1]
        return self.bucket_ingestion, s3_path


_minio_service: MinioService | None = None


def get_minio_service() -> MinioService:
    """Отримати singleton інстанс MinIO сервісу."""
    global _minio_service
    if _minio_service is None:
        _minio_service = MinioService()
    return _minio_service
