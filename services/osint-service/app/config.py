"""Конфігурація OSINT Service."""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Налаштування OSINT Service."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Загальні
    APP_NAME: str = "PREDATOR OSINT Service"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://predator:predator@localhost:5432/predator"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/2"

    # Kafka
    KAFKA_BOOTSTRAP_SERVERS: str = "localhost:9092"

    # Neo4j
    NEO4J_URI: str = "bolt://localhost:7687"
    NEO4J_USER: str = "neo4j"
    NEO4J_PASSWORD: str = "predator"

    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/3"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/3"

    # OSINT Tools Configuration
    SPIDERFOOT_URL: str = "http://localhost:5001"
    SPIDERFOOT_API_KEY: str = ""

    # External API Keys (опціонально)
    HUNTER_API_KEY: str = ""
    CLEARBIT_API_KEY: str = ""
    SHODAN_API_KEY: str = ""
    VIRUSTOTAL_API_KEY: str = ""
    FULLCONTACT_API_KEY: str = ""

    # Rate Limiting
    OSINT_RATE_LIMIT_PER_MINUTE: int = 60
    OSINT_MAX_CONCURRENT_SCANS: int = 10

    # Timeouts
    TOOL_TIMEOUT_SECONDS: int = 300
    SCAN_TIMEOUT_SECONDS: int = 1800


@lru_cache
def get_settings() -> Settings:
    """Отримати налаштування (cached)."""
    return Settings()
