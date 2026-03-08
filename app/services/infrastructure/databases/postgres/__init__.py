from functools import lru_cache
from .ha_manager import PostgresHAManager

@lru_cache()
def get_postgres_ha_manager() -> PostgresHAManager:
    return PostgresHAManager()

__all__ = ["PostgresHAManager", "get_postgres_ha_manager"]
