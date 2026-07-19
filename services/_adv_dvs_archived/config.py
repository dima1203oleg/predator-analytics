"""
Конфігурація сервісу ADV-DVS v56.5.
Всі параметри зчитуються зі змінних оточення.
Покриває повний System Memory Contract v4.0.
"""
import os

# ─── Backend API ────────────────────────────────────────────────────────────
CORE_API_URL: str = os.getenv("CORE_API_URL", f"http://{os.getenv('TARGET_HOST', '127.0.0.1')}:8090")
CORE_API_HEALTH_PATH: str = os.getenv("CORE_API_HEALTH_PATH", "/api/v1/health")

# ─── Frontend UI ─────────────────────────────────────────────────────────────
FRONTEND_URL: str = os.getenv("FRONTEND_URL", f"http://{os.getenv('TARGET_HOST', 'localhost')}:3030")

# ─── Kafka (Redpanda/Confluent) ──────────────────────────────────────────────
KAFKA_BOOTSTRAP_SERVERS: str = os.getenv("KAFKA_BOOTSTRAP_SERVERS", f"{os.getenv('TARGET_HOST', 'localhost')}:9092")
KAFKA_PROBE_TOPIC: str = os.getenv("KAFKA_PROBE_TOPIC", "__predator_probe__")

# ─── Redis ───────────────────────────────────────────────────────────────────
REDIS_URL: str = os.getenv("REDIS_URL", f"redis://{os.getenv('TARGET_HOST', 'localhost')}:6379/0")

# ─── PostgreSQL (SSOT) ──────────────────────────────────────────────────────
POSTGRES_DSN: str = os.getenv(
    "POSTGRES_DSN",
    f"postgresql+asyncpg://predator:predator@{os.getenv('TARGET_HOST', 'localhost')}:5432/predator",
)

# ─── Neo4j (Графовий аналіз) ────────────────────────────────────────────────
NEO4J_URI: str = os.getenv("NEO4J_URI", f"bolt://{os.getenv('TARGET_HOST', 'localhost')}:7687")
NEO4J_USER: str = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD: str = os.getenv("NEO4J_PASSWORD", "predator")

# ─── ClickHouse (OLAP) ──────────────────────────────────────────────────────
CLICKHOUSE_URL: str = os.getenv("CLICKHOUSE_URL", f"http://{os.getenv('TARGET_HOST', 'localhost')}:8123")
CLICKHOUSE_USER: str = os.getenv("CLICKHOUSE_USER", "default")
CLICKHOUSE_PASSWORD: str = os.getenv("CLICKHOUSE_PASSWORD", "")

# ─── OpenSearch (Повнотекстовий пошук) ──────────────────────────────────────
OPENSEARCH_URL: str = os.getenv("OPENSEARCH_URL", f"http://{os.getenv('TARGET_HOST', 'localhost')}:9200")
OPENSEARCH_USER: str = os.getenv("OPENSEARCH_USER", "admin")
OPENSEARCH_PASSWORD: str = os.getenv("OPENSEARCH_PASSWORD", "admin")

# ─── Qdrant (Векторна пам'ять) ──────────────────────────────────────────────
QDRANT_URL: str = os.getenv("QDRANT_URL", f"http://{os.getenv('TARGET_HOST', 'localhost')}:6333")

# ─── MinIO (S3 сховище) ─────────────────────────────────────────────────────
MINIO_URL: str = os.getenv("MINIO_URL", f"http://{os.getenv('TARGET_HOST', 'localhost')}:9000")
MINIO_HEALTH_PATH: str = os.getenv("MINIO_HEALTH_PATH", "/minio/health/live")

# ─── Таймаути (секунди) ──────────────────────────────────────────────────────
HTTP_TIMEOUT: float = float(os.getenv("ADV_DVS_HTTP_TIMEOUT", "5.0"))
KAFKA_TIMEOUT: float = float(os.getenv("ADV_DVS_KAFKA_TIMEOUT", "5.0"))
REDIS_TIMEOUT: float = float(os.getenv("ADV_DVS_REDIS_TIMEOUT", "3.0"))
DB_TIMEOUT: float = float(os.getenv("ADV_DVS_DB_TIMEOUT", "5.0"))
NEO4J_TIMEOUT: float = float(os.getenv("ADV_DVS_NEO4J_TIMEOUT", "5.0"))

# ─── Ollama (Локальний LLM) ──────────────────────────────────────────────────
OLLAMA_URL: str = os.getenv("OLLAMA_URL", f"http://{os.getenv('TARGET_HOST', 'localhost')}:11434")
OLLAMA_REQUIRED_MODEL: str = os.getenv("OLLAMA_REQUIRED_MODEL", "deepseek-r1:latest")
OLLAMA_INFERENCE_TIMEOUT: float = float(os.getenv("OLLAMA_INFERENCE_TIMEOUT", "120.0"))

# ─── LiteLLM (Проксі до всіх LLM) ──────────────────────────────────────────
LITELLM_URL: str = os.getenv("LITELLM_URL", f"http://{os.getenv('TARGET_HOST', 'localhost')}:4000")

# ─── Фоновий планувальник ────────────────────────────────────────────────────
CHECK_INTERVAL_SECONDS: int = int(os.getenv("ADV_DVS_CHECK_INTERVAL", "60"))
