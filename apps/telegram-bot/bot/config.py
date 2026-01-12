from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings  # Updated for pydantic v2


class Settings(BaseSettings):
    # Telegram
    TELEGRAM_BOT_TOKEN: str = Field(..., env="TELEGRAM_BOT_TOKEN")
    TELEGRAM_ADMIN_IDS: str = Field(default="", env="TELEGRAM_ADMIN_IDS")

    # AI Config
    GEMINI_API_KEY: str = Field(..., env="GEMINI_API_KEY")
    GEMINI_API_KEYS: str = Field(default="", env="GEMINI_API_KEYS")

    # Infrastructure
    REDIS_URL: str = Field("redis://redis:6379/0", env="REDIS_URL")
    POSTGRES_DSN: str = Field(..., env="POSTGRES_DSN")

    # WinSURF Config
    ENVIRONMENT: str = Field("rnd", env="ENVIRONMENT") # rnd, staging, production

    class Config:
        env_file = ".env"
        case_sensitive = True

    @property
    def admin_ids(self) -> List[int]:
        if not self.TELEGRAM_ADMIN_IDS.strip():
            return []
        try:
            return [int(x.strip()) for x in self.TELEGRAM_ADMIN_IDS.split(",") if x.strip()]
        except ValueError:
            return []

settings = Settings()
