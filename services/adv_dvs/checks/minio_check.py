"""ADV DVS: MinIO Check."""
import os
import asyncio
from predator_common.logging import get_logger

logger = get_logger("adv_dvs.checks.minio")

async def check_minio() -> dict:
    """Перевіряє з'єднання з MinIO (S3)."""
    try:
        from minio import Minio
        from urllib3.exceptions import MaxRetryError
    except ImportError:
        return {"status": "fail", "component": "minio", "message": "minio is not installed"}

    endpoint = os.getenv("MINIO_ENDPOINT", "minio:9000")
    access_key = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
    secret_key = os.getenv("MINIO_SECRET_KEY", "minioadmin")
    secure = os.getenv("MINIO_SECURE", "false").lower() == "true"
    
    logger.info("Перевірка підключення до MinIO")
    try:
        client = Minio(
            endpoint,
            access_key=access_key,
            secret_key=secret_key,
            secure=secure
        )
        # Виклик базового методу для перевірки з'єднання
        buckets = client.list_buckets()
        return {"status": "passed", "component": "minio", "message": f"Підключення успішне. Доступно {len(buckets)} бакетів."}
    except Exception as e:
        logger.error(f"Помилка MinIO: {e}")
        return {"status": "fail", "component": "minio", "message": str(e)}
