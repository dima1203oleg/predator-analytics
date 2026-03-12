#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"

echo "👁️  PREDATOR Analytics Frontend Watcher"
echo "========================================"
echo "Monitoring frontend deployment for changes..."
echo "Press Ctrl+C to stop watching"
echo ""

# Check if cluster is running
if ! k3d cluster list | grep -q "predator-local"; then
    echo "❌ k3d cluster 'predator-local' is not running."
    echo "Starting cluster..."
    k3d cluster start predator-local
fi

kubectl config use-context k3d-predator-local

# Watch frontend pods
watch -n 5 "echo '=== Frontend Pods ===' && kubectl get pods -n predator -l app=frontend -o wide && echo '' && echo '=== Recent Events ===' && kubectl get events -n predator --sort-by='.lastTimestamp' | tail -5"
