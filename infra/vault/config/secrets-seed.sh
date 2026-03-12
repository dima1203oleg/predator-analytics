#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# 🔐 Vault Secrets Seed — PREDATOR Analytics v56.0
# Заповнення початкових секретів (запускати один раз)
# ⚠️ Використовуйте ENV VARS для реальних значень в production!
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

VAULT_ADDR="${VAULT_ADDR:-http://vault.predator-system:8200}"

echo "🌱 Заповнення секретів PREDATOR..."

# ── PostgreSQL ────────────────────────────────────
vault kv put secret/predator/database/postgres \
  host="${PG_HOST:-predator-v55-postgres}" \
  port="${PG_PORT:-5432}" \
  database="${PG_DB:-predator_db}" \
  username="${PG_USER:-predator}" \
  password="${PG_PASSWORD:-CHANGE_ME_IN_PRODUCTION}" \
  connection_string="postgresql+asyncpg://${PG_USER:-predator}:${PG_PASSWORD:-CHANGE_ME}@${PG_HOST:-postgres}:${PG_PORT:-5432}/${PG_DB:-predator_db}"

# ── Neo4j ─────────────────────────────────────────
vault kv put secret/predator/neo4j/main \
  uri="${NEO4J_URI:-bolt://predator-v55-neo4j:7687}" \
  username="${NEO4J_USER:-neo4j}" \
  password="${NEO4J_PASSWORD:-CHANGE_ME_IN_PRODUCTION}"

# ── Redis ─────────────────────────────────────────
vault kv put secret/predator/redis/main \
  host="${REDIS_HOST:-predator-v55-redis}" \
  port="${REDIS_PORT:-6379}" \
  password="${REDIS_PASSWORD:-}" \
  url="redis://${REDIS_HOST:-redis}:${REDIS_PORT:-6379}/0"

# ── Kafka ─────────────────────────────────────────
vault kv put secret/predator/kafka/main \
  bootstrap_servers="${KAFKA_BROKERS:-predator-v55-redpanda:9092}" \
  security_protocol="${KAFKA_PROTOCOL:-PLAINTEXT}" \
  sasl_username="${KAFKA_USER:-}" \
  sasl_password="${KAFKA_PASSWORD:-}"

# ── OpenSearch ────────────────────────────────────
vault kv put secret/predator/opensearch/main \
  host="${OS_HOST:-predator-v55-opensearch}" \
  port="${OS_PORT:-9200}" \
  username="${OS_USER:-admin}" \
  password="${OS_PASSWORD:-CHANGE_ME_IN_PRODUCTION}" \
  scheme="${OS_SCHEME:-https}"

# ── MinIO ─────────────────────────────────────────
vault kv put secret/predator/minio/main \
  endpoint="${MINIO_ENDPOINT:-minio:9000}" \
  access_key="${MINIO_ACCESS_KEY:-predator}" \
  secret_key="${MINIO_SECRET_KEY:-CHANGE_ME_IN_PRODUCTION}" \
  bucket="${MINIO_BUCKET:-predator-uploads}"

# ── JWT Auth ──────────────────────────────────────
vault kv put secret/predator/auth/jwt \
  secret_key="${JWT_SECRET:-GENERATE_A_STRONG_SECRET_KEY_MIN_32_CHARS}" \
  algorithm="HS256" \
  access_token_expire_minutes="60" \
  refresh_token_expire_days="7"

# ── Telegram Bot ──────────────────────────────────
vault kv put secret/predator/external-apis/telegram \
  bot_token="${TELEGRAM_BOT_TOKEN:-CHANGE_ME}" \
  chat_id="${TELEGRAM_CHAT_ID:-0}"

# ── LLM API Keys ─────────────────────────────────
vault kv put secret/predator/external-apis/llm \
  openai_api_key="${OPENAI_API_KEY:-}" \
  anthropic_api_key="${ANTHROPIC_API_KEY:-}" \
  groq_api_key="${GROQ_API_KEY:-}" \
  litellm_master_key="${LITELLM_MASTER_KEY:-sk-predator}"

# ── Qdrant ────────────────────────────────────────
vault kv put secret/predator/qdrant/main \
  host="${QDRANT_HOST:-predator-v55-qdrant}" \
  port="${QDRANT_PORT:-6333}" \
  api_key="${QDRANT_API_KEY:-}"

# ── Grafana ───────────────────────────────────────
vault kv put secret/predator/monitoring/grafana \
  admin_user="${GRAFANA_USER:-admin}" \
  admin_password="${GRAFANA_PASSWORD:-CHANGE_ME_IN_PRODUCTION}"

echo ""
echo "✅ Всі секрети заповнено!"
echo "⚠️  Не забудьте замінити CHANGE_ME значення на реальні паролі!"
