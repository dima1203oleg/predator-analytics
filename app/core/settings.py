"""
Канонічна конфігурація PREDATOR Analytics v4.2.0.

Всі налаштування зчитуються зі змінних середовища.
Типізація обов'язкова (pydantic-settings v2).

Використання:
    from app.core.settings import get_settings
    settings = get_settings()
"""

from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import AnyHttpUrl, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Головні налаштування застосунку PREDATOR Analytics."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Загальні ─────────────────────────────────────────────
    APP_VERSION: str = "4.2.0"
    ENVIRONMENT: Literal["development", "testing", "staging", "production"] = (
        "development"
    )
    SECRET_KEY: str = Field(
        default="dev-secret-key-minimum-32-characters!!",
        min_length=32,
    )
    DEBUG: bool = True

    # ── База даних ────────────────────────────────────────────
    DATABASE_URL: str = "postgresql+asyncpg://predator:devpassword@localhost/predator"
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20

    # ── Redis ─────────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_CACHE_TTL: int = 300  # секунд

    # ── Neo4j ─────────────────────────────────────────────────
    NEO4J_URI: str = "bolt://localhost:7687"
    NEO4J_USER: str = "neo4j"
    NEO4J_PASSWORD: str = "devpassword"

    # ── OpenSearch ────────────────────────────────────────────
    OPENSEARCH_URL: str = "http://localhost:9200"

    # ── AI Gateway (LiteLLM) ──────────────────────────────────
    LITELLM_GATEWAY_URL: str = "http://localhost:4000"
    LITELLM_MASTER_KEY: str = ""

    # ── Qdrant (векторна БД для RAG) ──────────────────────────
    QDRANT_URL: str = "http://localhost:6333"
    QDRANT_COLLECTION: str = "predator_knowledge"

    # ── Keycloak (Auth) ───────────────────────────────────────
    KEYCLOAK_URL: str = "http://localhost:8080"
    KEYCLOAK_REALM: str = "predator"
    KEYCLOAK_CLIENT_ID: str = "predator-api"

    # ── CORS ─────────────────────────────────────────────────
    CORS_ORIGINS: list[str] = [
        "http://localhost:3030",  # Канонічний порт UI
        "https://app.predator.ua",
    ]

    # ── MLflow ────────────────────────────────────────────────
    MLFLOW_TRACKING_URI: str = "http://localhost:5000"

    # ── ML-моделі прогнозування ───────────────────────────────
    FORECAST_MODELS: list[dict] = Field(
        default_factory=lambda: [
            {
                "key": "prophet",
                "name_uk": "FB Prophet (Base)",
                "description_uk": "Статистична модель часових рядів",
            },
            {
                "key": "xgboost",
                "name_uk": "XGBoost Regressor",
                "description_uk": "Градієнтний бустинг для складних патернів",
            },
            {
                "key": "ensemble",
                "name_uk": "Ensemble (Prophet + XGBoost)",
                "description_uk": "Ансамбль моделей з максимальною точністю",
            },
        ]
    )

    # ── Проєкт ────────────────────────────────────────────────
    PROJECT_NAME: str = "PREDATOR Analytics"
    API_V1_STR: str = "/api/v1"


@lru_cache
def get_settings() -> Settings:
    """
    Повертає синглтон налаштувань.

    Кешується через @lru_cache для уникнення повторного читання .env.
    """
    return Settings()
