#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$DEPLOY_DIR")"

echo "🔄 PREDATOR Analytics Frontend Local Sync"
echo "=========================================="

# Check if k3d cluster is running
if ! k3d cluster list | grep -q "predator-local"; then
    echo "❌ k3d cluster 'predator-local' not found. Run deploy_local_k3d.sh first."
    exit 1
fi

# Switch to correct context
kubectl config use-context k3d-predator-local

# Get current image tag from values.yaml
CURRENT_TAG=$(grep -A 2 "frontend:" "$DEPLOY_DIR/helm/predator/values.yaml" | grep "tag:" | awk '{print $2}')
echo "📦 Current frontend image tag: $CURRENT_TAG"

# Build Docker image locally (or use pre-built from GHCR)
echo "🏗️  Building frontend Docker image..."
cd "$PROJECT_ROOT"

# Build image with local tag using root context (HR-05)
docker build -t predator-analytics-ui:local -f apps/predator-analytics-ui/Dockerfile .

# Load image into k3d cluster
echo "📥 Loading image into k3d cluster..."
k3d image import predator-analytics-ui:local -c predator-local

# Apply Helm chart with local image overrides
echo "🚀 Deploying frontend with Helm..."
helm upgrade --install predator "$DEPLOY_DIR/helm/predator" \
  -n predator-analytics \
  --set frontend.image.repository=predator-analytics-ui \
  --set frontend.image.tag=local \
  --set frontend.image.pullPolicy=IfNotPresent \
  --wait \
  --timeout 5m

# Cleanup (no temp files needed now)
rm -f "$TEMP_VALUES" "$TEMP_VALUES.bak"

# Wait for deployment to be ready
echo "⏳ Waiting for frontend deployment to be ready..."
kubectl rollout status deployment/predator-frontend -n predator --timeout=5m

echo ""
echo "✅ Frontend synced and deployed successfully!"
echo ""
echo "📍 Access frontend at:"
echo "   http://localhost:3030"
echo ""
echo "📊 Check deployment status:"
echo "   kubectl get pods -n predator -l app=frontend"
echo "   kubectl logs -n predator -l app=frontend -f"
echo ""
echo "🔄 To watch for changes and auto-sync:"
echo "   watch -n 5 'kubectl get pods -n predator -l app=frontend'"
