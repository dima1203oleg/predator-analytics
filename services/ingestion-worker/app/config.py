"""
Configuration — PREDATOR Analytics v55.1 Ironclad (Worker).
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

class WorkerSettings(BaseSettings):
    POSTGRES_USER: str = "predator"
    POSTGRES_PASSWORD: str = "predator"
    POSTGRES_DB: str = "predatordb"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    
    NEO4J_URI: str = "bolt://localhost:7687"
    NEO4J_USER: str = "neo4j"
    NEO4J_PASSWORD: str = "password"
    
    KAFKA_BOOTSTRAP_SERVERS: str = "localhost:9092"
    
    # OSINT Sources
    DATA_GOV_UA_API_KEY: str = ""
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

@lru_cache()
def get_settings():
    return WorkerSettings()
