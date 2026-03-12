# ═══════════════════════════════════════════════════════════════
# 🔐 Vault Policy — PREDATOR Admin
# Повний доступ до всіх секретів Predator
# ═══════════════════════════════════════════════════════════════

# Повний доступ до всіх секретів Predator
path "secret/data/predator/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "secret/metadata/predator/*" {
  capabilities = ["list", "read", "delete"]
}

# Керування PKI (сертифікати)
path "pki/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

# Керування transit engine (шифрування)
path "transit/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

# Audit logs (read-only)
path "sys/audit" {
  capabilities = ["read"]
}

path "sys/audit/*" {
  capabilities = ["read"]
}

# Policies management
path "sys/policies/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

# Auth methods management
path "sys/auth/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}
