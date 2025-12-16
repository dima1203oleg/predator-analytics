"""
Core Configuration
Shared settings for all Predator services.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from typing import Optional, List
import os


class Settings(BaseSettings):
    """Application settings with environment variable support"""

    # App
    APP_NAME: str = "Predator Analytics Core"
    APP_VERSION: str = "22.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    # API
    API_V1_PREFIX: str = "/api/v1"
    CORS_ORIGINS: List[str] = [
        os.getenv("FRONTEND_URL", "http://localhost:3000"),
        os.getenv("FRONTEND_DEV_URL", "http://localhost:5173")
    ]

    # Database - PostgreSQL for production, override via env
    # Defaulting to async driver for modern stack
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql+asyncpg://predator:predator_password@localhost:5432/predator_db")
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 5

    # Redis / Celery
    REDIS_URL: str = "redis://redis:6379/0"
    CELERY_BROKER_URL: str = "redis://redis:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://redis:6379/1"

    # Infrastructure
    QDRANT_URL: str = "http://qdrant:6333"
    OPENSEARCH_URL: str = "http://opensearch:9200"
    MINIO_ENDPOINT: str = "minio:9000"
    MINIO_ACCESS_KEY: str = "predator_admin"
    MINIO_SECRET_KEY: str = "predator_secret_key"

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
    ANTHROPIC_API_KEY: Optional[str] = None
    GROQ_API_KEY: Optional[str] = None
    MISTRAL_API_KEY: Optional[str] = None
    OPENROUTER_API_KEY: Optional[str] = None
    HUGGINGFACE_API_KEY: Optional[str] = None
    COHERE_API_KEY: Optional[str] = None
    TOGETHER_API_KEY: Optional[str] = None
    XAI_API_KEY: Optional[str] = None  # Grok
    DEEPSEEK_API_KEY: Optional[str] = None

    # LLM Base URLs (Configurable for proxies)
    LLM_OPENAI_BASE_URL: str = "https://api.openai.com/v1"
    LLM_GEMINI_BASE_URL: str = "https://generativelanguage.googleapis.com/v1beta"
    LLM_ANTHROPIC_BASE_URL: str = "https://api.anthropic.com/v1"
    LLM_GROQ_BASE_URL: str = "https://api.groq.com/openai/v1"
    LLM_MISTRAL_BASE_URL: str = "https://api.mistral.ai/v1"
    LLM_OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    LLM_OLLAMA_BASE_URL: str = "http://46.219.108.236:11434/api"
    LLM_HUGGINGFACE_BASE_URL: str = "https://api-inference.huggingface.co/models"
    LLM_COHERE_BASE_URL: str = "https://api.cohere.ai/v1"
    LLM_TOGETHER_BASE_URL: str = "https://api.together.xyz/v1"
    LLM_XAI_BASE_URL: str = "https://api.x.ai/v1"  # Grok
    LLM_DEEPSEEK_BASE_URL: str = "https://api.deepseek.com/v1"

    LLM_DEFAULT_PROVIDER: str = "gemini"
    LLM_FALLBACK_CHAIN: str = "gemini,groq,mistral,openai"

    # LLM Models
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    GEMINI_MODEL: str = "gemini-2.0-flash-exp"
    MISTRAL_MODEL: str = "mistral-large-latest"
    OPENAI_MODEL: str = "gpt-4o-mini"
    OLLAMA_MODEL: str = "qwen2.5-coder:7b"
    OPENROUTER_MODEL: str = "google/gemini-2.0-flash-exp:free"

    # TTS/STT
    GOOGLE_TTS_API_KEY: Optional[str] = None
    # Security
    SECRET_KEY: str = "change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Monitoring
    LOG_LEVEL: str = "INFO"
    PROMETHEUS_ENABLED: bool = True

    # Flower Security
    FLOWER_USER: Optional[str] = "admin"
    FLOWER_PASSWORD: Optional[str] = "admin"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

@lru_cache()
def get_settings() -> Settings:
    """Cached settings instance"""
    return Settings()

settings = get_settings()
