"""Інтеграція з MinIO для зберігання файлів.

Модуль для зберігання всіх файлів, сканів, PDF.
"""

from __future__ import annotations

from dataclasses import dataclass
import logging
import os
from pathlib import Path
from typing import Any

from minio import Minio
from minio.error import S3Error
import orjson

logger = logging.getLogger(__name__)


@dataclass
class MinIOConfig:
    """Конфігурація MinIO."""

    endpoint: str = "localhost:9000"
    access_key: str = "minioadmin"
    secret_key: str = "minioadmin"
    bucket: str = "declarations"
    secure: bool = False


class MinIOIntegration:
    """Інтеграція з MinIO."""

    def __init__(self, config: MinIOConfig):
        self.config = config
        self.client = Minio(
            config.endpoint,
            access_key=config.access_key,
            secret_key=config.secret_key,
            secure=config.secure
        )

    def create_bucket(self):
        """Створити бакет в MinIO."""
        try:
            if not self.client.bucket_exists(self.config.bucket):
                self.client.make_bucket(self.config.bucket)
                logger.info(f"Бакет {self.config.bucket} створено в MinIO")
            else:
                logger.info(f"Бакет {self.config.bucket} вже існує")
        except S3Error as e:
            logger.error(f"Помилка створення бакета: {e}")
            raise

    def upload_declaration_json(self, declaration_id: str, declaration_data: dict[str, Any]) -> int:
        """Завантажити JSON декларації в MinIO.
        
        Args:
            declaration_id: ID декларації
            declaration_data: Дані декларації
            
        Returns:
            Кількість завантажених об'єктів

        """
        try:
            # Конвертація в JSON
            json_data = orjson.dumps(declaration_data)

            # Формування шляху
            object_name = f"declarations/{declaration_id}.json"

            # Завантаження
            self.client.put_object(
                self.config.bucket,
                object_name,
                json_data,
                length=len(json_data),
                content_type="application/json"
            )

            logger.debug(f"JSON завантажено в MinIO: {object_name}")
            return 1

        except S3Error as e:
            logger.error(f"Помилка завантаження JSON в MinIO: {e}")
            return 0

    def upload_declaration_file(self, declaration_id: str, file_path: str, file_type: str = "scan") -> int:
        """Завантажити файл декларації в MinIO.
        
        Args:
            declaration_id: ID декларації
            file_path: Шлях до файлу
            file_type: Тип файлу (scan, pdf, etc.)
            
        Returns:
            Кількість завантажених об'єктів

        """
        try:
            # Перевірка існування файлу
            if not Path(file_path).exists():
                logger.error(f"Файл не існує: {file_path}")
                return 0

            # Визначення content type
            content_type = "application/octet-stream"
            if file_type == "pdf":
                content_type = "application/pdf"
            elif file_type == "scan":
                content_type = "image/jpeg"

            # Формування шляху
            file_extension = Path(file_path).suffix
            object_name = f"declarations/{declaration_id}/{file_type}{file_extension}"

            # Завантаження
            self.client.fput_object(
                self.config.bucket,
                object_name,
                file_path,
                content_type=content_type
            )

            logger.debug(f"Файл завантажено в MinIO: {object_name}")
            return 1

        except S3Error as e:
            logger.error(f"Помилка завантаження файлу в MinIO: {e}")
            return 0

    def download_declaration_json(self, declaration_id: str) -> dict[str, Any] | None:
        """Завантажити JSON декларації з MinIO.
        
        Args:
            declaration_id: ID декларації
            
        Returns:
            Дані декларації або None

        """
        try:
            object_name = f"declarations/{declaration_id}.json"

            response = self.client.get_object(self.config.bucket, object_name)
            json_data = response.read()

            declaration_data = orjson.loads(json_data)
            logger.debug(f"JSON завантажено з MinIO: {object_name}")
            return declaration_data

        except S3Error as e:
            logger.error(f"Помилка завантаження JSON з MinIO: {e}")
            return None

    def list_declaration_files(self, declaration_id: str) -> list[str]:
        """Отримати список файлів декларації.
        
        Args:
            declaration_id: ID декларації
            
        Returns:
            Список імен файлів

        """
        try:
            prefix = f"declarations/{declaration_id}/"
            objects = self.client.list_objects(self.config.bucket, prefix=prefix)

            file_names = [obj.object_name for obj in objects]
            logger.debug(f"Знайдено {len(file_names)} файлів для декларації {declaration_id}")
            return file_names

        except S3Error as e:
            logger.error(f"Помилка отримання списку файлів: {e}")
            return []

    def delete_declaration(self, declaration_id: str) -> int:
        """Видалити всі файли декларації з MinIO.
        
        Args:
            declaration_id: ID декларації
            
        Returns:
            Кількість видалених об'єктів

        """
        try:
            # Видалення JSON
            json_object = f"declarations/{declaration_id}.json"
            try:
                self.client.remove_object(self.config.bucket, json_object)
            except S3Error:
                pass

            # Видалення всіх файлів
            prefix = f"declarations/{declaration_id}/"
            objects = self.client.list_objects(self.config.bucket, prefix=prefix)

            deleted_count = 0
            for obj in objects:
                try:
                    self.client.remove_object(self.config.bucket, obj.object_name)
                    deleted_count += 1
                except S3Error:
                    pass

            logger.info(f"Видалено {deleted_count} файлів декларації {declaration_id} з MinIO")
            return deleted_count

        except S3Error as e:
            logger.error(f"Помилка видалення декларації з MinIO: {e}")
            return 0

    def get_bucket_stats(self) -> dict[str, Any]:
        """Отримати статистику бакета.
        
        Returns:
            Статистика бакета

        """
        try:
            objects = self.client.list_objects(self.config.bucket, recursive=True)

            total_size = sum(obj.size for obj in objects)
            total_count = len(objects)

            return {
                "total_objects": total_count,
                "total_size_bytes": total_size,
                "total_size_mb": total_size / (1024 * 1024),
            }

        except S3Error as e:
            logger.error(f"Помилка отримання статистики бакета: {e}")
            return {
                "total_objects": 0,
                "total_size_bytes": 0,
                "total_size_mb": 0.0,
            }

    def close(self):
        """Закрити з'єднання з MinIO."""
        # MinIO client не потребує явного закриття
        logger.info("З'єднання з MinIO закрито")


def get_minio_integration(config: MinIOConfig | None = None) -> MinIOIntegration:
    """Отримати інстанс інтеграції з MinIO."""
    if config is None:
        config = MinIOConfig(
            endpoint=os.getenv("MINIO_ENDPOINT", "localhost:9000"),
            access_key=os.getenv("MINIO_ACCESS_KEY", "minioadmin"),
            secret_key=os.getenv("MINIO_SECRET_KEY", "minioadmin"),
            bucket=os.getenv("MINIO_BUCKET", "declarations"),
            secure=os.getenv("MINIO_SECURE", "false").lower() == "true",
        )
    return MinIOIntegration(config)
