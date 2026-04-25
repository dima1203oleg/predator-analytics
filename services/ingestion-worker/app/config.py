"""Configuration — PREDATOR Analytics v55.1 Ironclad (Worker)."""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class WorkerSettings(BaseSettings):
    DATABASE_URL: str | None = None
    POSTGRES_USER: str = "predator"
    POSTGRES_PASSWORD: str = "predator"  # noqa: S105
    POSTGRES_DB: str = "predatordb"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432

    # Graph DB (Neo4j)
    NEO4J_URI: str = "bolt://localhost:7687"
    NEO4J_USER: str = "neo4j"
    NEO4J_PASSWORD: str = "password"  # noqa: S105

    REDIS_URL: str = "redis://localhost:6379/0"

    KAFKA_BOOTSTRAP_SERVERS: str = "predator-redpanda:9092"

    # ClickHouse Analytics
    CLICKHOUSE_HOST: str = "localhost"
    CLICKHOUSE_PORT: int = 9000
    CLICKHOUSE_USER: str = "default"
    CLICKHOUSE_PASSWORD: str = ""

    # OSINT Sources
    DATA_GOV_UA_API_KEY: str = ""
    YOUCONTROL_API_KEY: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

@lru_cache
def get_settings() -> WorkerSettings:
    return WorkerSettings()
