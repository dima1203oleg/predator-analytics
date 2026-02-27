from __future__ import annotations


"""Core Configuration
Shared settings for all Predator services.
"""
import sys


# ⚜️ ETERNAL RUNTIME GUARD
if sys.version_info < (3, 12):
    print("\n" + "!"*80, file=sys.stderr)
    print("❌ FATAL: RUNTIME VERSION MISMATCH", file=sys.stderr)
    print("   PREDATOR ANALYTICS v45+ STRICTLY REQUIRES PYTHON 3.12.", file=sys.stderr)
    print(f"   DETECTED: {sys.version}", file=sys.stderr)
    print("   ACTION: Upgrade to 3.12.x and recreate virtual environments.", file=sys.stderr)
    print("!"*80 + "\n", file=sys.stderr)
    sys.exit(1)

from functools import lru_cache
import json
import os
from typing import Any, List, Optional


# 🛡️ FALLBACK: DO ANY METHOD TO WORK WITHOUT PYDANTIC IF NEEDED
try:
    from pydantic import field_validator
    from pydantic_settings import BaseSettings, SettingsConfigDict
    HAS_PYDANTIC = True
except ImportError:
    HAS_PYDANTIC = False
    # Hack to allow code to run: Define dummy classes
    class BaseSettings:
        def __init__(self, **kwargs):
            # Load from env vars for all annotations
            for name, _ in self.__annotations__.items():
                val = os.getenv(name)
                if val is not None:
                    setattr(self, name, val)
                elif hasattr(self, name):
                    pass # Keep default
                else:
                    setattr(self, name, None)

    def field_validator(*args, **kwargs):
        def decorator(f):
            return f
        return decorator

    def SettingsConfigDict(*args, **kwargs):
        return {}

# Dynamic Project Root Detection
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../"))


class Settings(BaseSettings):
    """Application settings with environment variable support."""

    if HAS_PYDANTIC:
        @field_validator('CORS_ORIGINS', mode='before')
        @classmethod
        def parse_cors_origins(cls, v):
            """Parse CORS_ORIGINS from various formats."""
            if isinstance(v, list):
                return v
            if isinstance(v, str):
                v = v.strip()
                # Try JSON first
                if v.startswith('['):
                    try:
                        return json.loads(v)
                    except json.JSONDecodeError:
                        pass
                # Fallback to comma-separated
                return [x.strip() for x in v.split(',') if x.strip()]
            return ["*"]

        @field_validator('GEMINI_API_KEYS', mode='before')
        @classmethod
        def parse_gemini_keys(cls, v):
            if isinstance(v, list):
                return v
            if isinstance(v, str):
                return [x.strip() for x in v.split(',') if x.strip()]
            return []

    # App
    APP_NAME: str = "Predator Analytics Core"
    APP_VERSION: str = "26.2.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    # API
    API_V1_PREFIX: str = "/api/v1"

    # --- CONSTITUTIONAL CORE (v45.2) ---
    CONSTITUTION_HASH: str = "3f05c27896098e41471c246fb39e6a0dd43f7b11ff7c46db8f0195d3d3cae3cd"
    CONSTITUTION_PATH: str = os.path.join(PROJECT_ROOT, "docs/v45_CONSTITUTION.md")
    CORS_ORIGINS: list[str] = [
        "*", # Allow all in development/standalone modes for easier access
        os.getenv("FRONTEND_URL", "http://localhost:3000"),
        os.getenv("FRONTEND_DEV_URL", "http://localhost:5173"),
        "https://jolyn-bifid-eligibly.ngrok-free.dev", # New Root Canonical URL
        "http://localhost:8082",
        "http://localhost:8092"
    ]

    # Database
    POSTGRES_USER: str = "admin"
    POSTGRES_PASSWORD: str = "666666"
    POSTGRES_HOST: str = "postgres"
    POSTGRES_PORT: str = "5432"
    POSTGRES_DB: str = "predator_db"
    DATABASE_URL: str = "postgresql+asyncpg://admin:666666@postgres:5432/predator_db"

    @property
    def SYNC_DATABASE_URL(self) -> str:
        return self.DATABASE_URL.replace("+asyncpg", "")

    @property
    def CLEAN_DATABASE_URL(self) -> str:
        """Returns DSN without driver suffix, safe for asyncpg.connect()."""
        import re
        return re.sub(r'postgresql\+[^:]+:', 'postgresql:', self.DATABASE_URL)

    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 5

    # Redis / Celery
    REDIS_HOST: str = "redis"
    REDIS_PORT: int = 6379

    @property
    def REDIS_URL(self) -> str:
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/0"

    @property
    def CELERY_BROKER_URL(self) -> str:
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/1"

    @property
    def CELERY_RESULT_BACKEND(self) -> str:
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/1"

    # Message Queue (Event Bus)
    RABBITMQ_USER: str = "predator"
    RABBITMQ_PASSWORD: str = "predator_secret_key"
    RABBITMQ_HOST: str = "rabbitmq"

    @property
    def RABBITMQ_URL(self) -> str:
        return f"amqp://{self.RABBITMQ_USER}:{self.RABBITMQ_PASSWORD}@{self.RABBITMQ_HOST}:5672/"

    # Infrastructure
    QDRANT_URL: str = "http://qdrant:6333"
    OPENSEARCH_URL: str = "http://opensearch:9200"
    NEO4J_URL: str = "bolt://neo4j:7687"
    NEO4J_AUTH: str = "neo4j/predator_secret_key"
    MINIO_ENDPOINT: str = "minio:9000"
    MINIO_ACCESS_KEY: str = "predator_admin"
    MINIO_SECRET_KEY: str = "predator_secret_key"

    # Vault (Secrets)
    VAULT_ADDR: str = "http://vault:8200"
    VAULT_TOKEN: str | None = None

    # External Ukrainian APIs
    PROZORRO_API_URL: str = "https://public.api.openprocurement.org/api/2.5"
    EDR_API_URL: str = "https://data.gov.ua/api/3/action"
    NBU_API_URL: str = "https://bank.gov.ua/NBUStatService/v1"
    CUSTOMS_API_URL: str = "https://cabinet.customs.gov.ua/api"
    COURT_API_URL: str = "https://reyestr.court.gov.ua/api"

    # LLM Settings
    OPENAI_API_KEY: str | None = None
    GEMINI_API_KEY: str | None = None
    GEMINI_API_KEYS: Any = []
    ANTHROPIC_API_KEY: str | None = None
    GROQ_API_KEY: str | None = None
    MISTRAL_API_KEY: str | None = None
    OPENROUTER_API_KEY: str | None = None
    HUGGINGFACE_API_KEY: str | None = None
    COHERE_API_KEY: str | None = None
    TOGETHER_API_KEY: str | None = None
    XAI_API_KEY: str | None = None
    DEEPSEEK_API_KEY: str | None = None

    # LLM Base URLs
    LLM_OPENAI_BASE_URL: str = "https://api.openai.com/v1"
    LLM_GEMINI_BASE_URL: str = "https://generativelanguage.googleapis.com/v1beta"
    LLM_GROQ_BASE_URL: str = "https://api.groq.com/openai/v1"
    LLM_MISTRAL_BASE_URL: str = "https://api.mistral.ai/v1"
    LLM_OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    LLM_OLLAMA_BASE_URL: str = "http://host.docker.internal:11434/api"

    LLM_DEFAULT_PROVIDER: str = "gemini"
    LLM_FALLBACK_CHAIN: str = "gemini,groq,mistral,openai"

    # LLM Models
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    GEMINI_MODEL: str = "gemini-1.5-flash"
    MISTRAL_MODEL: str = "mistral-large-latest"
    OPENAI_MODEL: str = "gpt-4o-mini"
    OLLAMA_MODEL: str = "llama3.1:8b-instruct"
    OPENROUTER_MODEL: str = "google/gemini-2.0-flash-exp:free"

    # TTS/STT
    GOOGLE_TTS_API_KEY: str | None = None
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-in-production")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Upload limits
    MAX_UPLOAD_SIZE: int = 1024 * 1024 * 1024 # 1GB
    MAX_FILE_SIZE_MB: int = 1024

    # Monitoring
    LOG_LEVEL: str = "INFO"
    PROMETHEUS_ENABLED: bool = True
    OTEL_ENABLED: bool = os.getenv("OTEL_ENABLED", "False").lower() == "true"
    OTLP_ENDPOINT: str = os.getenv("OTLP_ENDPOINT", "otel-collector:4317")

    # Flower Security
    FLOWER_USER: str | None = os.getenv("FLOWER_USER", "admin")
    FLOWER_PASSWORD: str | None = os.getenv("FLOWER_PASSWORD", "admin")

    if HAS_PYDANTIC:
        @field_validator("SECRET_KEY", mode="after")
        @classmethod
        def validate_secret_key(cls, v):
            if v == "change-in-production":
                import logging
                logging.warning("⚠️  SECURITY RISKS: Default SECRET_KEY detected! Use a strong key in production.")
            return v

        model_config = SettingsConfigDict(
            env_file=".env" if os.access(".env", os.R_OK) else None,
            env_file_encoding="utf-8",
            case_sensitive=True,
            extra="ignore"
        )

@lru_cache
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
