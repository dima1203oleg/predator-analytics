import asyncio
import io
import logging

from minio import Minio

from app.config import settings

logger = logging.getLogger("ingestion-api.minio")

class MinioClient:
    def __init__(self):
        self.client = None

    def connect(self):
        try:
            self.client = Minio(
                settings.MINIO_ENDPOINT,
                access_key=settings.MINIO_ACCESS_KEY,
                secret_key=settings.MINIO_SECRET_KEY,
                secure=settings.MINIO_SECURE,
            )
            logger.info("✅ MinIO клієнт ініціалізовано")
        except Exception as e:
            logger.error(f"❌ Помилка ініціалізації MinIO: {e}")
            raise e

    def ensure_bucket(self, bucket_name: str):
        if not self.client.bucket_exists(bucket_name):
            self.client.make_bucket(bucket_name)

    async def upload_file(self, bucket_name: str, object_name: str, data: bytes, content_type: str = "application/octet-stream") -> str:
        """Асинхронне завантаження файлу в MinIO"""
        def _upload():
            self.ensure_bucket(bucket_name)
            self.client.put_object(
                bucket_name=bucket_name,
                object_name=object_name,
                data=io.BytesIO(data),
                length=len(data),
                content_type=content_type,
            )
            return f"minio://{bucket_name}/{object_name}"

        return await asyncio.to_thread(_upload)

minio_client = MinioClient()
