from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Канонічна конфігурація PREDATOR Core API (v61.0-ELITE)."""

    # Основні
    APP_NAME: str = "PREDATOR Analytics Core API"
    APP_VERSION: str = "61.0-ELITE"
    DEBUG: bool = False
    ENV: str = "development"
    TESTING: bool = False

    # Feature Flags (поступний rollout нового функціоналу)
    FF_KAFKA_ENABLED: bool = True
    FF_OPENSEARCH_ENABLED: bool = True
    FF_QDRANT_ENABLED: bool = True
    FF_RAG_ENABLED: bool = False
    FF_ANOMALY_DETECTION: bool = True
    FF_SOVEREIGN_AI: bool = False
    FF_GRAPH_SERVICE_ENABLED: bool = True  # Увімкнути Graph Service
    FF_MCP_ROUTER_ENABLED: bool = True   # Увімкнути MCP Router
    FF_RTB_ENGINE_ENABLED: bool = False  # Опціональний RTB Engine
    LLM_ROUTING_MODEL: str = "ollama/glm-5.1:latest"
    RTB_ENGINE_URL: str = "http://localhost:9600"

    # Автономна фабрика (OODA): за замовчуванням увімкнено; зупинка через API /factory/infinite/stop
    FACTORY_AUTO_START: bool = True
    # Сторож: періодично відновлює фонову задачу OODA, якщо вона впала, а is_running=true (без участі людини)
    FACTORY_WATCHDOG_ENABLED: bool = True
    FACTORY_WATCHDOG_INTERVAL_SEC: int = 90
    # APScheduler (Apache-2.0): планові «пульси» автоматизації поверх фабрики
    OSS_SCHEDULER_ENABLED: bool = True
    OSS_SCHEDULER_INTERVAL_MIN: int = 15

    # Alembic (міграції)
    ALEMBIC_AUTO_MIGRATE: bool = False

    # Circuit Breaker
    CB_FAILURE_THRESHOLD: int = 5
    CB_RESET_TIMEOUT_S: int = 60

    # VRAM Guard (8GB Limit)
    VRAM_LIMIT_MB: int = 8192
    VRAM_LLM_POOL_MB: int = 5632  # 5.5 GB
    VRAM_UI_RESERVE_MB: int = 2560  # 2.5 GB

    # Безпека (HR-06: Secrets from ENV)
    SECRET_KEY: str = "REQUIRED_IN_PRODUCTION"  # noqa: S105
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ROOT_TENANT_ID: str = "a0000000-0000-0000-0000-000000000001"
    AUTH_PROVIDER: str = "keycloak"
    KEYCLOAK_URL: str = "https://keycloak.local"
    KEYCLOAK_REALM: str = "predator"
    KEYCLOAK_AUDIENCE: str = "predator-api"
    KEYCLOAK_CLIENT_ID: str = "predator-api"
    KEYCLOAK_ADMIN_URL: str = "https://keycloak.local/admin/realms/predator"

    # Database (DATABASE_URL overrides parts)
    DATABASE_URL: str | None = None
    POSTGRES_USER: str = "predator"
    POSTGRES_PASSWORD: str = ""
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: str = "5432"
    POSTGRES_DB: str = "predator"

    @property
    def async_database_url(self) -> str:
        """Асинхронний URL бази (AsyncPG)."""
        db_url = self.DATABASE_URL
        if db_url:
            # Перетворюємо postgres:// у postgresql+asyncpg:// якщо потрібно
            if db_url.startswith("postgresql://"):
                db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
            elif db_url.startswith("postgres://"):
                db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)
            return db_url

        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Neo4j (Graph)
    NEO4J_URI: str = "bolt://localhost:7687"
    NEO4J_USER: str = "neo4j"
    NEO4J_PASSWORD: str = ""

    # OpenSearch / пошук
    OPENSEARCH_HOSTS: str = "https://localhost:9200"
    OPENSEARCH_USERNAME: str = "admin"
    OPENSEARCH_PASSWORD: str = ""
    OPENSEARCH_TLS_VERIFY: bool = False

    # ClickHouse / аналітика
    CLICKHOUSE_HOST: str = "localhost"
    CLICKHOUSE_PORT: int = 8123
    CLICKHOUSE_USER: str = "default"
    CLICKHOUSE_PASSWORD: str = ""
    CLICKHOUSE_DATABASE: str = "predator_analytics"

    # Qdrant / векторне сховище
    QDRANT_URL: str = "http://localhost:6333"
    QDRANT_API_KEY: str | None = None

    # Kafka / Redpanda Signal Bus (HR-17: tenant.{id}.category.name)
    KAFKA_BROKERS: str = "localhost:9092"
    KAFKA_OFFLINE_DIR: str = "/tmp/predator_offline"  # noqa: S108
    # Канонічні назви топіків — TZ v5.0 §5.1
    KAFKA_TOPIC_INGESTION_RAW: str = "tenant.default.ingestion.raw"
    KAFKA_TOPIC_INGESTION_CLEANED: str = "tenant.default.ingestion.cleaned"
    KAFKA_TOPIC_ENTITY_RESOLUTION: str = "tenant.default.entity.resolution"
    KAFKA_TOPIC_ENRICHMENT: str = "tenant.default.enrichment.events"
    KAFKA_TOPIC_RISK_ALERTS: str = "tenant.default.risk.alerts"
    KAFKA_TOPIC_DLQ: str = "tenant.default.dlq"
    KAFKA_TOPIC_QUARANTINE: str = "tenant.default.quarantine"
    KAFKA_TOPIC_OMNIVERSE_INGESTION: str = "omniverse-ingestion-triggers"

    # MinIO/S3
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = ""  # тільки через env var (HR-06)
    MINIO_SECRET_KEY: str = ""  # тільки через env var (HR-06)
    MINIO_SECURE: bool = False
    MINIO_REGION: str | None = None
    MINIO_BUCKET_RAW_UPLOADS: str = "raw-uploads"
    MINIO_BUCKET_PROCESSED: str = "processed-files"
    MINIO_BUCKET_REPORTS: str = "reports"

    # AI / LiteLLM / MCP
    LITELLM_GATEWAY_URL: str = "http://localhost:4000"
    LITELLM_API_BASE: str = "http://localhost:4000/v1"
    OLLAMA_MODEL: str = "glm-5.1:latest"
    MCP_ROUTER_URL: str = "http://localhost:8080/v1/query"
    OLLAMA_API_URL: str = "http://194.177.1.240:11434"
    LITELLM_MODEL: str = "ollama/glm-5.1:latest"
    LITELLM_REASONING_MODEL: str = "ollama/deepseek-r1:latest"
    LITELLM_ELITE_MODEL: str = "ollama/glm-5.1:latest"
    AI_ENGINE_URL: str = "http://localhost:9050"
    OLLAMA_EMBEDDING_MODEL: str = "nomic-embed-text"
    COPILOT_STREAM_BUFFER: int = 100
    MLFLOW_TRACKING_URL: str = "http://mlflow-internal.predator.svc:5000"

    # Gemini Enterprise Agent Platform (Free Tier)
    GEMINI_API_KEY: str = ""
    GEMINI_API_KEY_2: str = ""
    GEMINI_API_KEY_3: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"
    GEMINI_EMBEDDING_MODEL: str = "text-embedding-004"
    GOOGLE_CLOUD_PROJECT: str = ""
    GOOGLE_CLOUD_LOCATION: str = "global"

    # Modular Services
    GRAPH_SERVICE_URL: str = "http://localhost:8001"
    INGESTION_SERVICE_URL: str = "http://localhost:9100"
    OSINT_SERVICE_URL: str = "http://localhost:9200"
    WORKER_CPU_URL: str = "http://localhost:9300"
    WORKER_GPU_URL: str = "http://localhost:9400"
    JOB_SCHEDULER_URL: str = "http://localhost:9500"
    API_GATEWAY_URL: str = "https://predator.local"

    # Реєстри UA (OSINT)
    EDR_API_KEY: str | None = None
    COURT_API_KEY: str | None = None
    DPS_API_KEY: str | None = None
    YOUCONTROL_API_KEY: str | None = None
    PROZORRO_API_URL: str = "https://public.api.openprocurement.org/api/2.5"

    # Моніторинг та спостереження
    PROMETHEUS_ENABLED: bool = True
    OTEL_EXPORTER_OTLP_ENDPOINT: str = "http://localhost:4317"
    LOG_LEVEL: str = "INFO"
    ENABLE_TRACING: bool = False

    # Параметри CORS та швидкодії
    CORS_ORIGINS: str | list[str] = ["http://localhost:3030", "http://194.177.1.240:8000"]
    RATE_LIMIT_REQUESTS_PER_MINUTE: int = 1000
    RATE_LIMIT_ANALYTICS_PER_MINUTE: int = 50
    CACHE_TTL_SECONDS: int = 300
    CACHE_MAX_SIZE: int = 1000

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    """Отримати налаштування (cached)."""
    settings = Settings()
    if settings.DATABASE_URL:
        if "194.177.1.240" in settings.DATABASE_URL:
            settings.DATABASE_URL = settings.DATABASE_URL.replace("194.177.1.240", "postgres")
        if "admin:" in settings.DATABASE_URL:
            settings.DATABASE_URL = settings.DATABASE_URL.replace("admin:", "predator:")
    return settings
