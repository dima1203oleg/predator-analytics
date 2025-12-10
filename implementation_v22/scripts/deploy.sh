#!/usr/bin/env bash
set -euo pipefail

# Deploy via Helm/ArgoCD wrapper
ENV=${1:-dev}
echo "Deploying to environment: ${ENV}"

case ${ENV} in
  dev)
    helm upgrade --install predator ./helm --values ./helm/values-dev.yaml
    ;;
  staging)
    helm upgrade --install predator ./helm --values ./helm/values-staging.yaml
    ;;
  prod)
    helm upgrade --install predator ./helm --values ./helm/values-prod.yaml
    ;;
  *)
    echo "Unknown environment: ${ENV}"; exit 1
    ;;
esac

echo "Deploy script finished. In production use GitOps/ArgoCD for sync."
