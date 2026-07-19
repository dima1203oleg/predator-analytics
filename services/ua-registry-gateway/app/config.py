"""Конфігурація UA Registry Gateway."""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Налаштування мікросервісу UA Registry Gateway."""

    APP_NAME: str = "UA Registry Gateway"
    APP_VERSION: str = "1.0.0"

    # Kafka KRaft
    KAFKA_BROKERS: str = "localhost:9092"
    KAFKA_TOPIC_PROZORRO: str = "ua.prozorro.events"
    KAFKA_TOPIC_EDR: str = "ua.edr.events"

    # Prozorro API
    PROZORRO_API_URL: str = "https://public.api.openprocurement.org/api/2.5"
    PROZORRO_PAGE_LIMIT: int = 20
    PROZORRO_SCHEDULE_MINUTES: int = 60

    # data.gov.ua
    DATAGOV_BASE_URL: str = "https://data.gov.ua/api/3/action"
    DATAGOV_SCHEDULE_MINUTES: int = 360

    # API Keys for External Registries
    YOUCONTROL_API_KEY: str = ""
    OPENDATABOT_API_KEY: str = ""

    # MinIO/S3 (для резервного збереження сирих JSON)
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = ""
    MINIO_SECRET_KEY: str = ""
    MINIO_SECURE: bool = False
    MINIO_BUCKET_RAW: str = "ua-registry-raw"

    # HTTP timeout
    HTTP_TIMEOUT_SECONDS: int = 30
    HTTP_RETRIES: int = 3

    LOG_LEVEL: str = "INFO"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    """Отримати налаштування (кешовано)."""
    return Settings()
