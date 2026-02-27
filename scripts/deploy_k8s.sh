
#!/bin/bash
set -e

# PREDATOR V45.1 - K8S DEPLOYMENT SCRIPT
# Assumes kubectl context is set correctly.

echo "🚢 Deploying Predator Analytics v45.1 to Kubernetes..."

NAMESPACE="predator-analytics"

# 1. Ensure Namespace
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

# 2. Add Helm Repo (if external deps needed)
# helm repo add bitnami https://charts.bitnami.com/bitnami

# 3. Update Dependencies
echo "📦 Updating Chart Dependencies..."
# helm dependency update ./helm/predator-analytics

# 4. Install / Upgrade
echo "🚀 Applying Helm Chart..."
helm upgrade --install predator ./helm/predator-analytics \
  --namespace $NAMESPACE \
  --create-namespace \
  --atomic \
  --timeout 10m

echo "✅ Deployment Triggered."
echo "   Monitor status: kubectl get pods -n $NAMESPACE -w"
