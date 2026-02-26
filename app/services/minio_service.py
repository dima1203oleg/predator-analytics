import logging

logger = logging.getLogger("app.services.minio_service")

class MinioService:
    async def upload_file(self, bucket: str, file_name: str, data: bytes):
        logger.info(f"Uploading {file_name} to bucket {bucket} (Mock)")
        return True

minio_service = MinioService()
