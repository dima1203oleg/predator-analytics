# ═══════════════════════════════════════════════════════════════
# 🔐 Vault Policy — PREDATOR Ingestion Worker
# Мінімальний набір секретів для ETL worker
# ═══════════════════════════════════════════════════════════════

# Доступ до секретів бази даних (read-only)
path "secret/data/predator/database/*" {
  capabilities = ["read"]
}

# Доступ до Kafka credentials
path "secret/data/predator/kafka/*" {
  capabilities = ["read"]
}

# Доступ до MinIO для зберігання файлів
path "secret/data/predator/minio/*" {
  capabilities = ["read"]
}

# Доступ до OpenSearch для індексації
path "secret/data/predator/opensearch/*" {
  capabilities = ["read"]
}

# Доступ до Redis для кешування
path "secret/data/predator/redis/*" {
  capabilities = ["read"]
}

# Lease renewal
path "sys/leases/renew" {
  capabilities = ["create"]
}
