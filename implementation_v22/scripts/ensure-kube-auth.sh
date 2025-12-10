#!/usr/bin/env bash
set -euo pipefail

# Helper: checks kubectl connectivity and kube-context
CONTEXT=${1:-}
if [ -z "${CONTEXT}" ]; then
  echo "Usage: $0 <kube-context>"
  exit 1
fi

echo "Checking kubectl context: ${CONTEXT}"
kubectl config use-context ${CONTEXT}
kubectl get nodes -o wide

echo "If this prints nodes, kube auth and connectivity are valid."
