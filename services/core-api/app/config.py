import os
from functools import lru_cache
from typing import Any

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Канонічна конфігурація PREDATOR Core API (v55.1 Ironclad)."""

    # Основні
    APP_NAME: str = "PREDATOR Analytics Core API"
    APP_VERSION: str = "55.1.0"
    DEBUG: bool = False
    ENV: str = "development"

    # Безпека (HR-06: Secrets from ENV)
    SECRET_KEY: str = "REQUIRED_IN_PRODUCTION"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ROOT_TENANT_ID: str = "global-system"

    # PostgreSQL (Patroni HA)
    POSTGRES_USER: str = "predator"
    POSTGRES_PASSWORD: str = "predator"
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: str = "5432"
    POSTGRES_DB: str = "predator"

    @property
    def async_database_url(self) -> str:
        """Асинхронний URL бази (AsyncPG)."""
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    # Neo4j (Graph)
    NEO4J_URI: str = "bolt://localhost:7687"
    NEO4J_USER: str = "neo4j"
    NEO4J_PASSWORD: str = "predator"

    # Kafka
    KAFKA_BROKERS: str = "localhost:9092"
    KAFKA_OFFLINE_DIR: str = "/tmp/predator_offline"  # Offline-first

    # AI / LiteLLM / MCP
    LITELLM_API_BASE: str = "http://localhost:4000/v1"
    OLLAMA_MODEL: str = "llama3"
    MCP_ROUTER_URL: str = "http://localhost:8080/v1/query"
    
    # Modular Services
    GRAPH_SERVICE_URL: str = "http://localhost:9030"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    """Отримати налаштування (cached)."""
    return Settings()
