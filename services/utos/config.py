"""
Конфігурація UTOS v61.0-ELITE.
Єдине джерело конфігурації для всіх шарів тестування.
Усі параметри зчитуються зі змінних оточення.
"""
import os

# ─── Backend API ────────────────────────────────────────────────────────────
CORE_API_URL: str = os.getenv("CORE_API_URL", "http://localhost:8000")
CORE_API_HEALTH_PATH: str = os.getenv("CORE_API_HEALTH_PATH", "/api/v1/health")

# ─── Frontend UI ─────────────────────────────────────────────────────────────
FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3030")

# ─── Kafka / Redpanda ────────────────────────────────────────────────────────
KAFKA_BOOTSTRAP_SERVERS: str = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:19092")
KAFKA_PROBE_TOPIC: str = os.getenv("KAFKA_PROBE_TOPIC", "__utos_probe__")

# ─── Redis ───────────────────────────────────────────────────────────────────
REDIS_URL: str = os.getenv("REDIS_URL", "redis://:predator_redis@localhost:6379/0")
REDIS_TIMEOUT: float = float(os.getenv("UTOS_REDIS_TIMEOUT", "3.0"))

# ─── PostgreSQL (SSOT) ──────────────────────────────────────────────────────
POSTGRES_DSN: str = os.getenv(
    "POSTGRES_DSN",
    "postgresql://predator:predator_secret@localhost:5432/predator_db",
)

# ─── Neo4j (Graph Brain) ────────────────────────────────────────────────────
NEO4J_URI: str = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER: str = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD: str = os.getenv("NEO4J_PASSWORD", "predator_neo4j")
NEO4J_TIMEOUT: float = float(os.getenv("UTOS_NEO4J_TIMEOUT", "5.0"))
NEO4J_GRAPH_ENABLED: bool = os.getenv("UTOS_NEO4J_GRAPH_ENABLED", "true").lower() == "true"

# ─── ClickHouse (OLAP) ──────────────────────────────────────────────────────
CLICKHOUSE_URL: str = os.getenv("CLICKHOUSE_URL", "http://localhost:8123")
CLICKHOUSE_USER: str = os.getenv("CLICKHOUSE_USER", "default")
CLICKHOUSE_PASSWORD: str = os.getenv("CLICKHOUSE_PASSWORD", "")

# ─── OpenSearch (Повнотекстовий пошук) ──────────────────────────────────────
OPENSEARCH_URL: str = os.getenv("OPENSEARCH_URL", "http://localhost:9200")

# ─── Qdrant (Векторна пам'ять) ──────────────────────────────────────────────
QDRANT_URL: str = os.getenv("QDRANT_URL", "http://localhost:6333")

# ─── MinIO (S3 сховище) ─────────────────────────────────────────────────────
MINIO_URL: str = os.getenv("MINIO_URL", "http://localhost:9000")
MINIO_HEALTH_PATH: str = os.getenv("MINIO_HEALTH_PATH", "/minio/health/live")

# ─── Ollama (Локальний LLM) ─────────────────────────────────────────────────
OLLAMA_URL: str = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_REQUIRED_MODEL: str = os.getenv("OLLAMA_REQUIRED_MODEL", "deepseek-r1:latest")
OLLAMA_INFERENCE_TIMEOUT: float = float(os.getenv("OLLAMA_INFERENCE_TIMEOUT", "120.0"))

# ─── LiteLLM (Проксі до всіх LLM) ──────────────────────────────────────────
LITELLM_URL: str = os.getenv("LITELLM_URL", "http://localhost:4000")

# ─── Observability ───────────────────────────────────────────────────────────
PROMETHEUS_URL: str = os.getenv("PROMETHEUS_URL", "http://localhost:9090")
GRAFANA_URL: str = os.getenv("GRAFANA_URL", "http://localhost:3000")
LOKI_URL: str = os.getenv("LOKI_URL", "http://localhost:3100")

# ─── CI/CD Self-Healing ─────────────────────────────────────────────────────
GITHUB_ACTIONS_TOKEN: str = os.getenv("GITHUB_ACTIONS_TOKEN", "")
ARGOCD_URL: str = os.getenv("ARGOCD_URL", "http://localhost:8080")
ARGOCD_TOKEN: str = os.getenv("ARGOCD_TOKEN", "")

# ─── Chaos Engine ────────────────────────────────────────────────────────────
# safe = тільки неінвазивні тести; destructive = kill pod, break network
CHAOS_MODE: str = os.getenv("UTOS_CHAOS_MODE", "safe")
CHAOS_RECOVERY_TIMEOUT_S: int = int(os.getenv("UTOS_CHAOS_RECOVERY_TIMEOUT", "60"))

# ─── UTOS Service ────────────────────────────────────────────────────────────
UTOS_PORT: int = int(os.getenv("UTOS_PORT", "8003"))
UTOS_REPORT_DIR: str = os.getenv("UTOS_REPORT_DIR", "./reports")
HTTP_TIMEOUT: float = float(os.getenv("UTOS_HTTP_TIMEOUT", "5.0"))
DB_TIMEOUT: float = float(os.getenv("UTOS_DB_TIMEOUT", "5.0"))

# ─── Зважена модель оцінювання ───────────────────────────────────────────────
SCORE_WEIGHTS: dict[str, float] = {
    "infra": 0.15,
    "data": 0.20,
    "ai": 0.15,
    "api": 0.10,
    "frontend": 0.10,
    "dom": 0.10,
    "security": 0.10,
    "performance": 0.10,
}
