#!/bin/bash
set -e

USERNAME=$1
if [ -z "$USERNAME" ]; then
  echo "Usage: $0 <username>"
  exit 1
fi

NAMESPACE="dev-${USERNAME}"
POD=$(kubectl get pod -n "$NAMESPACE" -l app=dev,user="$USERNAME" -o jsonpath='{.items[0].metadata.name}')

echo "Verifying Pod: $POD in Namespace: $NAMESPACE"

# Python version check
kubectl exec -n "$NAMESPACE" "$POD" -- python3.12 --version | grep -q "3.12"
echo "Python 3.12 check: PASSED"

# Node version check
kubectl exec -n "$NAMESPACE" "$POD" -- node --version | grep -q "v20.15.0"
echo "Node 20.15.0 check: PASSED"

# kubectl check
kubectl exec -n "$NAMESPACE" "$POD" -- kubectl version --client
echo "kubectl check: PASSED"

# docker check
kubectl exec -n "$NAMESPACE" "$POD" -- docker version
echo "docker check: PASSED"

# GPU check
kubectl exec -n "$NAMESPACE" "$POD" -- nvidia-smi
echo "GPU check: PASSED"

# Data Provider registration check
echo "Checking Dev Container Data Provider..."
# Note: Check home directory of devuser inside the pod
if kubectl exec -n "$NAMESPACE" "$POD" -- test -f /home/devuser/.vscode-server/data/Machine/.devcontainer-data-provider; then
    echo "✅ Data Provider registered"
else
    echo "⚠️  Data Provider not registered (VS Code may not show container automatically)"
fi

# devcontainer.json path check
if kubectl exec -n "$NAMESPACE" "$POD" -- test -f /workspaces/infra/devcontainer/.devcontainer/devcontainer.json; then
    echo "✅ devcontainer.json found"
else
    echo "❌ devcontainer.json missing in /workspaces/infra/devcontainer/.devcontainer/"
    exit 1
fi

echo "Verification complete: ALL SYSTEMS READY"
