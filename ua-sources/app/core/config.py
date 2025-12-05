"""
UA Sources - Configuration Module
Environment-based settings for Ukrainian data sources
"""
from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional, List
import os


class Settings(BaseSettings):
    """Application settings with environment variable support"""
    
    # App
    APP_NAME: str = "UA Sources Service"
    APP_VERSION: str = "19.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"
    
    # API
    API_V1_PREFIX: str = "/api/v1"
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]
    
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://predator:predator@localhost:5432/predator_ua"
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 5
    
    # Redis / Celery
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/1"
    
    # External Ukrainian APIs
    PROZORRO_API_URL: str = "https://public.api.openprocurement.org/api/2.5"
    EDR_API_URL: str = "https://data.gov.ua/api/3/action"
    NBU_API_URL: str = "https://bank.gov.ua/NBUStatService/v1"
    CUSTOMS_API_URL: str = "https://cabinet.customs.gov.ua/api"
    COURT_API_URL: str = "https://reyestr.court.gov.ua/api"
    
    # LLM Settings
    OPENAI_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    LLM_DEFAULT_PROVIDER: str = "gemini"
    
    # Security
    SECRET_KEY: str = "change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    # Monitoring
    LOG_LEVEL: str = "INFO"
    PROMETHEUS_ENABLED: bool = True
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Cached settings instance"""
    return Settings()


settings = get_settings()
