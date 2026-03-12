# ═══════════════════════════════════════════════════════════════
# 🔐 Vault Policy — PREDATOR Core API
# Дозволяє читання секретів для core-api сервісу
# ═══════════════════════════════════════════════════════════════

# Доступ до секретів бази даних
path "secret/data/predator/database/*" {
  capabilities = ["read"]
}

# Доступ до секретів Redis
path "secret/data/predator/redis/*" {
  capabilities = ["read"]
}

# Доступ до JWT ключів
path "secret/data/predator/auth/*" {
  capabilities = ["read"]
}

# Доступ до API ключів зовнішніх сервісів
path "secret/data/predator/external-apis/*" {
  capabilities = ["read"]
}

# Доступ до Kafka credentials
path "secret/data/predator/kafka/*" {
  capabilities = ["read"]
}

# Доступ до OpenSearch credentials
path "secret/data/predator/opensearch/*" {
  capabilities = ["read"]
}

# Доступ до Neo4j credentials
path "secret/data/predator/neo4j/*" {
  capabilities = ["read"]
}

# Доступ до MinIO credentials
path "secret/data/predator/minio/*" {
  capabilities = ["read"]
}

# Дозволити оновлення lease (auto-renewal)
path "sys/leases/renew" {
  capabilities = ["create"]
}

path "sys/leases/lookup" {
  capabilities = ["create"]
}
