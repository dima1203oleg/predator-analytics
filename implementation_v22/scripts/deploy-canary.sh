#!/usr/bin/env bash
# Deploy the umbrella helm chart to a canary namespace using provided kubeconfig
# Usage: deploy-canary.sh <kubeconfig-base64> [namespace: canary]

set -euo pipefail

KUBECONFIG_B64=${1:-}
NAMESPACE=${2:-canary}
RELEASE_NAME=${3:-predator-canary}
CHART_PATH=${4:-./helm/predator-umbrella}
VALUES_FILE=${5:-./infra/helm/umbrella/values-canary.yaml}

if [[ -z "$KUBECONFIG_B64" ]]; then
  echo "No KUBECONFIG provided; skipping canary deployment." >&2
  exit 0
fi

# Decode kubeconfig into a temporary file
KUBECONFIG_FILE=$(mktemp)
trap 'rm -f "$KUBECONFIG_FILE"' EXIT
echo "$KUBECONFIG_B64" | base64 -d > "$KUBECONFIG_FILE"
export KUBECONFIG="$KUBECONFIG_FILE"

# Ensure helm is installed
if ! command -v helm >/dev/null 2>&1; then
  echo "Helm is required for canary toggle; please install helm" >&2
  exit 1
fi

# Create namespace if not exists
kubectl get ns "$NAMESPACE" || kubectl create ns "$NAMESPACE"

# Perform helm upgrade/install
helm upgrade --install "$RELEASE_NAME" "$CHART_PATH" \
  --namespace "$NAMESPACE" \
  -f "$VALUES_FILE" \
  --wait --timeout 5m

# Simple check
kubectl rollout status deploy/$(helm get manifest "$RELEASE_NAME" -n "$NAMESPACE" | grep "kind: Deployment" -A2 | grep "name:" | sed 's/.*name: //g' | head -1) -n "$NAMESPACE" || true

echo "Canary deploy completed (namespace: $NAMESPACE, release: $RELEASE_NAME)"
