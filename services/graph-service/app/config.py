"""Graph Service Config — PREDATOR Analytics v55.1 Ironclad.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "PREDATOR Graph Service"
    VERSION: str = "55.1.0"

    # Neo4j
    NEO4J_URI: str = "bolt://localhost:7687"
    NEO4J_USER: str = "neo4j"
    NEO4J_PASSWORD: str = "predator_graph_secret"

    # KEDA & Telemetry
    ENABLE_METRICS: bool = True

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

def get_settings() -> Settings:
    return Settings()
