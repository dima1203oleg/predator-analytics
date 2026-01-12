#!/usr/bin/env bash
set -euo pipefail

# Usage:
# ./setup-nvidia-context.sh --kubeconfig /path/to/nvidia-kubeconfig
# or
# export KUBECONFIG=/path/to/nvidia-kubeconfig
# ./setup-nvidia-context.sh

function usage(){
  echo "Usage: $0 [--kubeconfig path] [--context-name nvidia]"
  exit 1
}

KUBECONFIG_PATH="${KUBECONFIG:-}"
CONTEXT_NAME="nvidia"

while [[ $# -gt 0 ]]; do
  case $1 in
    --kubeconfig)
      KUBECONFIG_PATH="$2"; shift 2;;
    --context-name)
      CONTEXT_NAME="$2"; shift 2;;
    *) usage;;
  esac
done

if [ -n "$KUBECONFIG_PATH" ]; then
  if [ ! -f "$KUBECONFIG_PATH" ]; then
    echo "kubeconfig file doesn't exist: $KUBECONFIG_PATH"; exit 2
  fi
  export KUBECONFIG="$KUBECONFIG_PATH"
  echo "Exported KUBECONFIG=$KUBECONFIG"
fi

echo "Checking current contexts..."
kubectl config get-contexts || true

if kubectl config get-contexts | grep -q "${CONTEXT_NAME}"; then
  echo "Found context ${CONTEXT_NAME}, attempting to switch..."
  kubectl config use-context ${CONTEXT_NAME}
else
  echo "Context ${CONTEXT_NAME} not found. If you have the kubeconfig file, you can add a context via:
  kubectl config --kubeconfig=${KUBECONFIG:-$HOME/.kube/config} set-context ${CONTEXT_NAME} --cluster=<clusterName> --user=<userName>"
  exit 3
fi

echo "Verifying Kubernetes cluster connectivity (nodes)..."
kubectl --context ${CONTEXT_NAME} get nodes

echo "Connectivity OK for context '${CONTEXT_NAME}'."
