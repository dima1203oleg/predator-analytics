"""Configuration — PREDATOR Analytics v61.0-ELITE Ironclad (Worker)."""
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

    REDIS_URL: str = "redis://redis:6379/0"

    KAFKA_BOOTSTRAP_SERVERS: str = "redpanda:9092"
    KAFKA_TOPIC_INGESTION_RAW: str = "tenant.default.ingestion.raw"
    KAFKA_TOPIC_ENRICHMENT: str = "tenant.default.enrichment.events"
    KAFKA_TOPIC_OMNIVERSE_INGESTION: str = "omniverse-ingestion-triggers"
    KAFKA_TOPIC_PROZORRO: str = "ua.prozorro.events"
    KAFKA_TOPIC_EDR: str = "ua.edr.events"
    ROOT_TENANT_ID: str = "global-system"

    # ClickHouse Analytics
    CLICKHOUSE_HOST: str = "clickhouse"
    CLICKHOUSE_PORT: int = 8123
    CLICKHOUSE_USER: str = "default"
    CLICKHOUSE_PASSWORD: str = ""

    # LLM
    LLM_OLLAMA_BASE_URL: str = "http://ollama:11434"
    OLLAMA_MODEL: str = "nemotron-mini"

    # OSINT Sources
    DATA_GOV_UA_API_KEY: str = ""
    YOUCONTROL_API_KEY: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

@lru_cache
def get_settings() -> WorkerSettings:
    return WorkerSettings()

# Глобальний екземпляр для backward compatibility
settings: WorkerSettings = get_settings()
