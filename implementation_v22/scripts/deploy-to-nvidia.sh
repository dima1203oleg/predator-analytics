#!/usr/bin/env bash
set -euo pipefail

# This script expects:
#  - `argocd` CLI authenticated (argocd login ...)
#  - kubeconfig with a context named 'nvidia' or a provided kube-context
#  - The GitOps repo to point to the overlay path `apps/overlays/production`.

KUBE_CTX=${1:-nvidia}
APP_NAME=${2:-predator-prod}
NOMAD=false

# Optional: accept additional CLI args
shift 2 || true

function usage(){
  echo "Usage: $0 [kube-context] [argocd-app-name]"
  echo "Env: KUBECONFIG=/path/to/kubeconfig"
  exit 1
}

echo "Using kube context: ${KUBE_CTX}"
echo "Syncing ArgoCD app: ${APP_NAME}"

if ! kubectl --context ${KUBE_CTX} get nodes >/dev/null 2>&1; then
  echo "ERROR: Kubernetes context '${KUBE_CTX}' not reachable. Aborting."
  exit 1
fi

echo "Validating umbrella chart locally (helm template)..."
./scripts/validate-helm.sh || true

echo "Ensuring ArgoCD app '${APP_NAME}' is present and synced..."
if ! command -v argocd >/dev/null 2>&1; then
  echo "ERROR: 'argocd' CLI not found. Run ./scripts/ensure-argocd-cli.sh"
  exit 2
fi

./scripts/argocd-check-app.sh ${APP_NAME} || {
  echo "Argocd app ${APP_NAME} check failed. Create it or verify the repo path and repo credentials in ArgoCD."; exit 3;
}

argocd app sync ${APP_NAME} || {
  echo "Argocd sync failed; exiting with non-zero status."; exit 2;
}

echo "Application ${APP_NAME} sync requested. Wait for ArgoCD to reconcile or check status with:
  argocd app get ${APP_NAME}
"

echo "If NVIDIA cluster unreachable, to fallback to Mac use values-mac.yaml and target the dev overlay accordingly."
