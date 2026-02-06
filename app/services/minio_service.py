from __future__ import annotations

from datetime import timedelta
import logging

from minio import Minio
from minio.error import S3Error

from app.libs.core.config import settings


logger = logging.getLogger("service.minio")

class MinIOService:
    """Service for interacting with MinIO object storage.
    Handles raw data uploads, model artifacts, and exports.

    Uses lazy initialization to allow app startup without MinIO.
    """
    def __init__(self):
        # Using unified settings from app.libs.core.config
        self.endpoint = settings.MINIO_ENDPOINT.replace("http://", "").replace("https://", "")
        self.access_key = settings.MINIO_ACCESS_KEY
        self.secret_key = settings.MINIO_SECRET_KEY
        self.secure = False # Usually false for local docker-compose

        self._client = None  # Lazy initialization
        self.buckets = ["raw-data", "datasets", "models", "exports"]
        self._initialized = False

    @property
    def client(self):
        """Lazy client initialization."""
        if self._client is None:
            self._client = Minio(
                self.endpoint,
                access_key=self.access_key,
                secret_key=self.secret_key,
                secure=self.secure
            )
        return self._client

    def _ensure_buckets(self):
        """Create buckets if they don't exist. Called on first use."""
        if self._initialized:
            return

        for bucket in self.buckets:
            try:
                if not self.client.bucket_exists(bucket):
                    self.client.make_bucket(bucket)
                    logger.info(f"Created bucket: {bucket}")
            except S3Error as e:
                logger.warning(f"MinIO bucket {bucket} not accessible: {e}")
            except Exception as e:
                logger.warning(f"MinIO connection failed: {e}")

        self._initialized = True

    async def upload_file(self, bucket: str, object_name: str, file_path: str, content_type: str = "application/octet-stream") -> str:
        """Upload a file to MinIO.
        Returns the object name on success.
        """
        try:
            self._ensure_buckets()
            self.client.fput_object(
                bucket,
                object_name,
                file_path,
                content_type=content_type
            )
            logger.info(f"Uploaded {file_path} to {bucket}/{object_name}")
            return object_name
        except S3Error as e:
            logger.exception(f"Upload failed: {e}")
            raise

    async def upload_bytes(self, bucket: str, object_name: str, data: bytes, content_type: str = "application/octet-stream") -> str:
        """Upload raw bytes to MinIO."""
        from io import BytesIO
        try:
            self._ensure_buckets()
            self.client.put_object(
                bucket,
                object_name,
                BytesIO(data),
                length=len(data),
                content_type=content_type
            )
            logger.info(f"Uploaded bytes to {bucket}/{object_name}")
            return object_name
        except S3Error as e:
            logger.exception(f"Upload failed: {e}")
            raise

    async def get_presigned_url(self, bucket: str, object_name: str, expires: int = 3600) -> str:
        """Generate a presigned URL for downloading an object.
        Default expiry: 1 hour.
        """
        try:
            return self.client.presigned_get_object(
                bucket,
                object_name,
                expires=timedelta(seconds=expires)
            )
        except S3Error as e:
            logger.exception(f"Failed to generate presigned URL: {e}")
            raise

    async def download_file(self, bucket: str, object_name: str, file_path: str):
        """Download a file from MinIO to local path."""
        try:
            self.client.fget_object(bucket, object_name, file_path)
            logger.info(f"Downloaded {bucket}/{object_name} to {file_path}")
        except S3Error as e:
            logger.exception(f"Download failed: {e}")
            raise

    async def list_objects(self, bucket: str, prefix: str = "") -> list:
        """List objects in a bucket with optional prefix filter."""
        try:
            objects = self.client.list_objects(bucket, prefix=prefix, recursive=True)
            return [obj.object_name for obj in objects]
        except S3Error as e:
            logger.exception(f"List failed: {e}")
            return []
