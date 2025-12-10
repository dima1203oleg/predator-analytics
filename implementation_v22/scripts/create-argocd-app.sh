#!/usr/bin/env bash
set -euo pipefail

APP_NAME=${1:-}
REPO_URL=${2:-}
APP_PATH=${3:-}
TARGET_REV=${4:-HEAD}
NAMESPACE=${5:-default}
PROJECT=${6:-default}

if [ -z "$APP_NAME" ] || [ -z "$REPO_URL" ] || [ -z "$APP_PATH" ]; then
  echo "Usage: $0 <app-name> <repo-url> <path> [targetRevision] [namespace] [project]"
  exit 1
fi

if ! command -v argocd >/dev/null 2>&1; then
  echo "argocd CLI not installed. Run ./scripts/ensure-argocd-cli.sh" >&2
  exit 2
fi

echo "Creating argocd app ${APP_NAME} -> ${REPO_URL} ${APP_PATH}"
argocd app create ${APP_NAME} \
  --repo ${REPO_URL} --path ${APP_PATH} --dest-server https://kubernetes.default.svc --dest-namespace ${NAMESPACE} --revision ${TARGET_REV} --project ${PROJECT} || true

echo "Application ${APP_NAME} created (or already exists). Run 'argocd app list' or 'argocd app get ${APP_NAME}' to check." 
