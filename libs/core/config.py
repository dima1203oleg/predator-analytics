"""
Core Configuration
Shared settings for all Predator services.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from functools import lru_cache
from typing import Optional, List
import json
import os


class Settings(BaseSettings):
    """Application settings with environment variable support"""

    @field_validator('CORS_ORIGINS', mode='before')
    @classmethod
    def parse_cors_origins(cls, v):
        """Parse CORS_ORIGINS from various formats"""
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

    # App
    APP_NAME: str = "Predator Analytics Core"
    APP_VERSION: str = "22.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    # API
    API_V1_PREFIX: str = "/api/v1"
    CORS_ORIGINS: List[str] = [
        "*", # Allow all in development/standalone modes for easier access
        os.getenv("FRONTEND_URL", "http://localhost:3000"),
        os.getenv("FRONTEND_DEV_URL", "http://localhost:5173"),
        "https://2e41c24fa38f0d.lhr.life", # Root Canonical URL
        "http://localhost:8082",
        "http://localhost:8092"
    ]

    # Database
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "admin")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "666666")
    POSTGRES_HOST: str = os.getenv("POSTGRES_HOST", "localhost")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "predator_db")

    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    @property
    def SYNC_DATABASE_URL(self) -> str:
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    @property
    def CLEAN_DATABASE_URL(self) -> str:
        """Returns DSN without driver suffix, safe for asyncpg.connect()"""
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 5

    # Redis / Celery
    REDIS_HOST: str = os.getenv("REDIS_HOST", "redis")
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
    RABBITMQ_USER: str = os.getenv("RABBITMQ_USER", "predator")
    RABBITMQ_PASSWORD: str = os.getenv("RABBITMQ_PASSWORD", "predator_secret_key")
    RABBITMQ_HOST: str = os.getenv("RABBITMQ_HOST", "rabbitmq")

    @property
    def RABBITMQ_URL(self) -> str:
        return f"amqp://{self.RABBITMQ_USER}:{self.RABBITMQ_PASSWORD}@{self.RABBITMQ_HOST}:5672/"

    # Infrastructure
    QDRANT_URL: str = os.getenv("QDRANT_URL", "http://qdrant:6333")
    OPENSEARCH_URL: str = os.getenv("OPENSEARCH_URL", "http://opensearch:9200")
    MINIO_ENDPOINT: str = os.getenv("MINIO_ENDPOINT", "minio:9000")
    MINIO_ACCESS_KEY: str = os.getenv("MINIO_ROOT_USER", "predator_admin")
    MINIO_SECRET_KEY: str = os.getenv("MINIO_ROOT_PASSWORD", "predator_secret_key")

    # Vault (Secrets)
    VAULT_ADDR: str = "http://vault:8200"
    VAULT_TOKEN: Optional[str] = None

    # External Ukrainian APIs
    PROZORRO_API_URL: str = "https://public.api.openprocurement.org/api/2.5"
    EDR_API_URL: str = "https://data.gov.ua/api/3/action"
    NBU_API_URL: str = "https://bank.gov.ua/NBUStatService/v1"
    CUSTOMS_API_URL: str = "https://cabinet.customs.gov.ua/api"
    COURT_API_URL: str = "https://reyestr.court.gov.ua/api"

    # LLM Settings
    OPENAI_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    # GEMINI_API_KEYS removed from Settings class to bypass Pydantic parsing issues
    ANTHROPIC_API_KEY: Optional[str] = None
    GROQ_API_KEY: Optional[str] = None
    MISTRAL_API_KEY: Optional[str] = None
    OPENROUTER_API_KEY: Optional[str] = None
    HUGGINGFACE_API_KEY: Optional[str] = None
    COHERE_API_KEY: Optional[str] = None
    TOGETHER_API_KEY: Optional[str] = None
    XAI_API_KEY: Optional[str] = None
    DEEPSEEK_API_KEY: Optional[str] = None

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
    OLLAMA_MODEL: str = "qwen2.5:latest"
    OPENROUTER_MODEL: str = "google/gemini-2.0-flash-exp:free"

    # TTS/STT
    GOOGLE_TTS_API_KEY: Optional[str] = None
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-in-production")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Monitoring
    LOG_LEVEL: str = "INFO"
    PROMETHEUS_ENABLED: bool = True

    # Flower Security
    FLOWER_USER: Optional[str] = os.getenv("FLOWER_USER", "admin")
    FLOWER_PASSWORD: Optional[str] = os.getenv("FLOWER_PASSWORD", "admin")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
