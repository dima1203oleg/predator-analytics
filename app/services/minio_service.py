import asyncio
import logging
import os

from minio import Minio
from minio.error import S3Error

logger = logging.getLogger("app.services.minio_service")


class MinioService:
    def __init__(self):
        endpoint = os.getenv("MINIO_ENDPOINT", "minio:9000")
        access_key = os.getenv("MINIO_ROOT_USER", "predator")
        secret_key = os.getenv("MINIO_ROOT_PASSWORD", "predator_password")
        secure = os.getenv("MINIO_SECURE", "false").lower() == "true"

        self.client = Minio(endpoint, access_key=access_key, secret_key=secret_key, secure=secure)
        logger.info(f"Minio client initialized for endpoint {endpoint}")

    async def upload_file(self, bucket: str, object_name: str, file_path: str):
        """Uploads a file to MinIO."""
        try:
            # Ensure bucket exists
            found = await asyncio.to_thread(self.client.bucket_exists, bucket)
            if not found:
                await asyncio.to_thread(self.client.make_bucket, bucket)
                logger.info(f"Created bucket: {bucket}")

            # Upload file
            await asyncio.to_thread(self.client.fput_object, bucket, object_name, file_path)
            logger.info(f"Successfully uploaded {file_path} to {bucket}/{object_name}")
            return True
        except S3Error as e:
            logger.exception(f"MinIO S3 error: {e}")
            raise
        except Exception as e:
            logger.exception(f"MinIO upload failed: {e}")
            raise


minio_service = MinioService()
