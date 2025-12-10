#!/usr/bin/env bash
set -euo pipefail

APP_NAME=${1:-}
if [ -z "$APP_NAME" ]; then
  echo "Usage: $0 <argocd-app-name>"
  exit 1
fi

if ! command -v argocd >/dev/null 2>&1; then
  echo "argocd CLI is not installed. Use ./scripts/ensure-argocd-cli.sh to install it." >&2
  exit 2
fi

if argocd app get ${APP_NAME} >/dev/null 2>&1; then
  echo "Argocd app ${APP_NAME} exists." && exit 0
else
  echo "Argocd app ${APP_NAME} not found. You need to create it in ArgoCD or check the repo path and permissions." >&2
  exit 3
fi
