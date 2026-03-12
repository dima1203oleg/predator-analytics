#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"

echo "🔄 PREDATOR Analytics Frontend Restart"
echo "======================================"

# Check if cluster exists
if ! k3d cluster list | grep -q "predator-local"; then
    echo "❌ k3d cluster 'predator-local' not found."
    echo "Run deploy_local_k3d.sh first to create the cluster."
    exit 1
fi

# Ensure cluster is running
echo "🚀 Ensuring k3d cluster is running..."
k3d cluster start predator-local 2>/dev/null || true

# Switch context
kubectl config use-context k3d-predator-local

# Delete existing frontend pods to force restart
echo "🛑 Stopping frontend pods..."
kubectl delete pods -n predator -l app=frontend --ignore-not-found=true

# Wait for new pods to be created
echo "⏳ Waiting for new frontend pods to start..."
sleep 3

# Wait for deployment to be ready
echo "⏳ Waiting for deployment to be ready..."
kubectl rollout status deployment/predator-frontend -n predator --timeout=5m || true

# Get pod status
echo ""
echo "✅ Frontend restarted!"
echo ""
echo "📍 Frontend pods status:"
kubectl get pods -n predator -l app=frontend -o wide

echo ""
echo "🌐 Access frontend at: http://localhost:3030"
echo ""
echo "📊 View logs:"
echo "   kubectl logs -n predator -l app=frontend -f"
