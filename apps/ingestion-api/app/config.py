import os

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Kafka
    REDPANDA_BROKERS: str = os.getenv("REDPANDA_BROKERS", "redpanda:9092")

    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://redis:6379/1")

    # MinIO
    MINIO_ENDPOINT: str = os.getenv("MINIO_ENDPOINT", "minio:9000")
    MINIO_ACCESS_KEY: str = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
    MINIO_SECRET_KEY: str = os.getenv("MINIO_SECRET_KEY", "minioadmin")
    MINIO_SECURE: bool = os.getenv("MINIO_SECURE", "false").lower() == "true"

    class Config:
        """Pydantic config."""

        env_file = ".env"

settings = Settings()
