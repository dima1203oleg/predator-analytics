"""MinIO/S3 Service — PREDATOR Analytics v55.2-SM-EXTENDED.

Зберігання файлів в об'єктному сховищі.
Реалізація згідно TZ §2.5.
"""
from datetime import UTC, datetime
import hashlib
import io
from pathlib import Path

from minio import Minio
from minio.error import S3Error

from app.config import get_settings
from predator_common.logging import get_logger

logger = get_logger("minio_service")
settings = get_settings()


class MinIOService:
    """Сервіс для роботи з MinIO/S3.

    Підтримує offline-first режим: якщо MinIO недоступний,
    файли зберігаються локально.
    """

    # Tenant Isolation (TZ §3.1)
    # Бакети створюються динамічно для кожного тенанта:
    # 1. tenant-{id}-raw
    # 2. tenant-{id}-processed
    # 3. tenant-{id}-artifacts

    def __init__(self) -> None:
        self._client: Minio | None = None
        self._connected = False
        self._offline_dir = Path(settings.KAFKA_OFFLINE_DIR) / "minio_offline"
        self._offline_dir.mkdir(parents=True, exist_ok=True)

        # Парсимо MinIO URL з конфігурації
        self._endpoint = getattr(settings, "MINIO_ENDPOINT", "localhost:9000")
        self._access_key = getattr(settings, "MINIO_ACCESS_KEY", "minioadmin")
        self._secret_key = getattr(settings, "MINIO_SECRET_KEY", "minioadmin")
        self._secure = getattr(settings, "MINIO_SECURE", False)

    async def connect(self) -> bool:
        """Підключення до MinIO."""
        if self._connected and self._client:
            return True

        try:
            self._client = Minio(
                self._endpoint,
                access_key=self._access_key,
                secret_key=self._secret_key,
                secure=self._secure,
            )
            # Перевірка з'єднання
            self._client.list_buckets()
            self._connected = True
            logger.info("MinIO підключено", extra={"endpoint": self._endpoint})
            return True

        except Exception as e:
            logger.warning(f"MinIO недоступний, використовую offline режим: {e}")
            self._connected = False
            return False

    def get_raw_bucket(self, tenant_id: str) -> str:
        """Повертає назву бакету для вхідних файлів тенанта."""
        return f"tenant-{str(tenant_id).lower()}-raw"

    def get_processed_bucket(self, tenant_id: str) -> str:
        """Повертає назву бакету для оброблених/збагачених даних."""
        return f"tenant-{str(tenant_id).lower()}-processed"

    def get_artifacts_bucket(self, tenant_id: str) -> str:
        """Повертає назву бакету для артефактів та звітів."""
        return f"tenant-{str(tenant_id).lower()}-artifacts"

    async def ensure_tenant_buckets(self, tenant_id: str):
        """Створює необхідні бакети для тенанта якщо вони не існують."""
        if not self._client:
            return

        buckets = [
            self.get_raw_bucket(tenant_id),
            self.get_processed_bucket(tenant_id),
            self.get_artifacts_bucket(tenant_id)
        ]
        
        for bucket in buckets:
            try:
                if not self._client.bucket_exists(bucket):
                    self._client.make_bucket(bucket)
                    logger.info(f"Створено бакет ізоляції: {bucket}")
            except S3Error as e:
                logger.error(f"Помилка створення бакету {bucket}: {e}")

    def _compute_hash(self, data: bytes) -> str:
        """Обчислює SHA-256 хеш даних."""
        return hashlib.sha256(data).hexdigest()

    async def upload_file(
        self,
        bucket: str,
        object_name: str,
        data: bytes,
        content_type: str = "application/octet-stream",
    ) -> tuple[bool, str, str]:
        """Завантажує файл в MinIO.

        Args:
            bucket: Назва бакету
            object_name: Шлях до об'єкта в бакеті
            data: Бінарні дані файлу
            content_type: MIME тип файлу

        Returns:
            Tuple[success, s3_path, content_hash]

        """
        content_hash = self._compute_hash(data)
        s3_path = f"s3://{bucket}/{object_name}"

        # Спроба завантаження в MinIO
        if self._connected and self._client:
            try:
                self._client.put_object(
                    bucket,
                    object_name,
                    io.BytesIO(data),
                    length=len(data),
                    content_type=content_type,
                )
                logger.info(f"Завантажено в MinIO: {s3_path}")
                return True, s3_path, content_hash
            except S3Error as e:
                logger.error(f"Помилка завантаження в MinIO: {e}")
                self._connected = False

        # Offline fallback
        offline_path = await self._save_offline(bucket, object_name, data)
        return False, f"file://{offline_path}", content_hash

    async def _save_offline(self, bucket: str, object_name: str, data: bytes) -> str:
        """Зберігає файл локально для подальшого завантаження."""
        # Створюємо структуру директорій
        bucket_dir = self._offline_dir / bucket
        bucket_dir.mkdir(parents=True, exist_ok=True)

        # Зберігаємо файл
        file_path = bucket_dir / object_name.replace("/", "_")
        file_path.write_bytes(data)

        # Зберігаємо метадані
        meta_path = file_path.with_suffix(file_path.suffix + ".meta")
        meta_path.write_text(f"{bucket}\n{object_name}\n{datetime.now(UTC).isoformat()}")

        logger.info(f"Збережено offline: {file_path}")
        return str(file_path)

    async def download_file(self, bucket: str, object_name: str) -> bytes | None:
        """Завантажує файл з MinIO.

        Returns:
            Бінарні дані файлу або None якщо не знайдено

        """
        if not self._connected or not self._client:
            await self.connect()

        if not self._connected:
            return None

        try:
            response = self._client.get_object(bucket, object_name)
            data = response.read()
            response.close()
            response.release_conn()
            return data
        except S3Error as e:
            logger.error(f"Помилка завантаження з MinIO: {e}")
            return None

    async def get_presigned_url(
        self,
        bucket: str,
        object_name: str,
        expires_hours: int = 1,
    ) -> str | None:
        """Генерує presigned URL для доступу до файлу.

        Returns:
            URL або None якщо помилка

        """
        if not self._connected or not self._client:
            await self.connect()

        if not self._connected:
            return None

        try:
            from datetime import timedelta
            url = self._client.presigned_get_object(
                bucket,
                object_name,
                expires=timedelta(hours=expires_hours),
            )
            return url
        except S3Error as e:
            logger.error(f"Помилка генерації presigned URL: {e}")
            return None

    async def delete_file(self, bucket: str, object_name: str) -> bool:
        """Видаляє файл з MinIO."""
        if not self._connected or not self._client:
            return False

        try:
            self._client.remove_object(bucket, object_name)
            logger.info(f"Видалено з MinIO: {bucket}/{object_name}")
            return True
        except S3Error as e:
            logger.error(f"Помилка видалення з MinIO: {e}")
            return False

    async def list_objects(self, bucket: str, prefix: str = "") -> list[dict]:
        """Список об'єктів в бакеті."""
        if not self._connected or not self._client:
            await self.connect()

        if not self._connected:
            return []

        try:
            objects = self._client.list_objects(bucket, prefix=prefix, recursive=True)
            return [
                {
                    "name": obj.object_name,
                    "size": obj.size,
                    "last_modified": obj.last_modified.isoformat() if obj.last_modified else None,
                }
                for obj in objects
            ]
        except S3Error as e:
            logger.error(f"Помилка отримання списку об'єктів: {e}")
            return []

    async def flush_offline(self) -> int:
        """Завантажує всі offline файли в MinIO.

        Returns:
            Кількість успішно завантажених файлів

        """
        if not self._connected:
            await self.connect()

        if not self._connected:
            return 0

        uploaded_count = 0
        for meta_path in self._offline_dir.rglob("*.meta"):
            try:
                meta_lines = meta_path.read_text().strip().split("\n")
                if len(meta_lines) < 2:
                    continue

                bucket, object_name = meta_lines[0], meta_lines[1]
                file_path = meta_path.with_suffix("")

                if not file_path.exists():
                    meta_path.unlink()
                    continue

                data = file_path.read_bytes()
                self._client.put_object(
                    bucket,
                    object_name,
                    io.BytesIO(data),
                    length=len(data),
                )

                file_path.unlink()
                meta_path.unlink()
                uploaded_count += 1
                logger.debug(f"Завантажено offline: {bucket}/{object_name}")

            except Exception as e:
                logger.error(f"Помилка завантаження offline {meta_path}: {e}")

        if uploaded_count > 0:
            logger.info(f"Завантажено {uploaded_count} offline файлів")

        return uploaded_count


# ======================== SINGLETON ========================

_minio_service: MinIOService | None = None


def get_minio_service() -> MinIOService:
    """Отримати singleton інстанс MinIO сервісу."""
    global _minio_service
    if _minio_service is None:
        _minio_service = MinIOService()
    return _minio_service


async def init_minio():
    """Ініціалізація MinIO при старті застосунку."""
    service = get_minio_service()
    await service.connect()
    await service.flush_offline()


async def close_minio():
    """Закриття MinIO при зупинці застосунку."""
    global _minio_service
    _minio_service = None
