"""
Predator Analytics - Configuration
Environment-based settings with validation
"""
from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional
import os


class Settings(BaseSettings):
    """Application settings with environment variable support"""
    
    # App
    APP_NAME: str = "Predator Analytics"
    APP_VERSION: str = "19.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"  # development, staging, production
    
    # API
    API_V1_PREFIX: str = "/api/v1"
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:5173"]
    
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://predator:predator@localhost:5432/predator_db"
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 10
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # LLM Providers - API Keys
    OPENAI_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    MISTRAL_API_KEY: Optional[str] = None
    GROQ_API_KEY: Optional[str] = None
    
    # LLM Router Settings
    LLM_DEFAULT_PROVIDER: str = "gemini"  # openai, gemini, anthropic, mistral, groq
    LLM_FALLBACK_CHAIN: list[str] = ["gemini", "openai", "anthropic"]
    LLM_MAX_RETRIES: int = 3
    LLM_TIMEOUT: int = 60
    
    # Vector DB
    QDRANT_URL: str = "http://localhost:6333"
    QDRANT_API_KEY: Optional[str] = None
    
    # Security
    SECRET_KEY: str = "super-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # External APIs (Ukrainian Sources)
    PROZORRO_API_URL: str = "https://public.api.openprocurement.org/api/2.5"
    EDR_API_URL: str = "https://data.gov.ua/api/3/action"
    NBU_API_URL: str = "https://bank.gov.ua/NBUStatService/v1"
    CUSTOMS_API_URL: str = "https://cabinet.customs.gov.ua/api"
    
    # Kubernetes / ArgoCD
    KUBECONFIG_PATH: Optional[str] = None
    ARGOCD_SERVER: str = "https://argocd.local"
    ARGOCD_TOKEN: Optional[str] = None
    
    # Monitoring
    PROMETHEUS_ENABLED: bool = True
    LOG_LEVEL: str = "INFO"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Cached settings instance"""
    return Settings()


settings = get_settings()
