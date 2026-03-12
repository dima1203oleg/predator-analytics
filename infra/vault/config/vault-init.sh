#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# 🔐 Vault Init & Configure — PREDATOR Analytics v56.0
# Ініціалізація Vault, Kubernetes Auth, та seed секретів
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

VAULT_ADDR="${VAULT_ADDR:-http://vault.predator-system:8200}"
NAMESPACE="${NAMESPACE:-predator-v55}"
SERVICE_ACCOUNT_NAMES=("core-api" "graph-service" "cerebro" "rtb-engine" "mcp-router" "ingestion-worker" "frontend")

echo "═══════════════════════════════════════════════════"
echo "🔐 Ініціалізація Vault для PREDATOR Analytics"
echo "═══════════════════════════════════════════════════"

# Крок 1: Ініціалізація Vault (одноразово)
if ! vault status 2>/dev/null | grep -q "Initialized.*true"; then
  echo "📦 Ініціалізація Vault..."
  vault operator init \
    -key-shares=5 \
    -key-threshold=3 \
    -format=json > /tmp/vault-init.json

  echo "⚠️  ЗБЕРЕЖІТЬ unseal keys та root token у безпечному місці!"
  echo "Root Token: $(jq -r '.root_token' /tmp/vault-init.json)"
  echo "Unseal Keys збережено у /tmp/vault-init.json"

  # Auto-unseal (для dev)
  for i in 0 1 2; do
    UNSEAL_KEY=$(jq -r ".unseal_keys_b64[$i]" /tmp/vault-init.json)
    vault operator unseal "$UNSEAL_KEY"
  done

  export VAULT_TOKEN=$(jq -r '.root_token' /tmp/vault-init.json)
else
  echo "✅ Vault вже ініціалізовано"
fi

# Крок 2: Увімкнути KV v2 secrets engine
echo "📂 Налаштування secrets engine..."
vault secrets enable -path=secret kv-v2 2>/dev/null || echo "KV v2 вже увімкнено"

# Крок 3: Увімкнути Kubernetes Auth
echo "🔑 Налаштування Kubernetes Auth..."
vault auth enable kubernetes 2>/dev/null || echo "Kubernetes auth вже увімкнено"

# Конфігурація Kubernetes Auth
vault write auth/kubernetes/config \
  kubernetes_host="https://kubernetes.default.svc:443" \
  token_reviewer_jwt="$(cat /var/run/secrets/kubernetes.io/serviceaccount/token 2>/dev/null || echo '')" \
  kubernetes_ca_cert="$(cat /var/run/secrets/kubernetes.io/serviceaccount/ca.crt 2>/dev/null || echo '')" \
  issuer="https://kubernetes.default.svc.cluster.local" || echo "⚠️ K8s auth config — потрібно запустити всередині кластера"

# Крок 4: Завантажити policies
echo "📜 Завантаження Vault policies..."
POLICY_DIR="$(dirname "$0")/../policies"

vault policy write predator-api "$POLICY_DIR/predator-api.hcl"
vault policy write predator-worker "$POLICY_DIR/predator-worker.hcl"
vault policy write predator-admin "$POLICY_DIR/predator-admin.hcl"

# Крок 5: Створити Kubernetes Auth roles
echo "🎭 Створення Kubernetes Auth roles..."

# Core API role
vault write auth/kubernetes/role/core-api \
  bound_service_account_names="core-api" \
  bound_service_account_namespaces="$NAMESPACE" \
  policies="predator-api" \
  ttl=1h

# Graph Service role
vault write auth/kubernetes/role/graph-service \
  bound_service_account_names="graph-service" \
  bound_service_account_namespaces="$NAMESPACE" \
  policies="predator-api" \
  ttl=1h

# Ingestion Worker role
vault write auth/kubernetes/role/ingestion-worker \
  bound_service_account_names="ingestion-worker" \
  bound_service_account_namespaces="$NAMESPACE" \
  policies="predator-worker" \
  ttl=1h

# Cerebro role
vault write auth/kubernetes/role/cerebro \
  bound_service_account_names="cerebro" \
  bound_service_account_namespaces="$NAMESPACE" \
  policies="predator-api" \
  ttl=1h

# RTB Engine role
vault write auth/kubernetes/role/rtb-engine \
  bound_service_account_names="rtb-engine" \
  bound_service_account_namespaces="$NAMESPACE" \
  policies="predator-api" \
  ttl=1h

# MCP Router role
vault write auth/kubernetes/role/mcp-router \
  bound_service_account_names="mcp-router" \
  bound_service_account_namespaces="$NAMESPACE" \
  policies="predator-api" \
  ttl=1h

echo ""
echo "═══════════════════════════════════════════════════"
echo "✅ Vault налаштовано для PREDATOR Analytics"
echo "   Namespace: $NAMESPACE"
echo "   Services: ${SERVICE_ACCOUNT_NAMES[*]}"
echo "═══════════════════════════════════════════════════"
