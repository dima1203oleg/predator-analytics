#!/bin/bash
# Kubernetes deployment script for Predator Analytics
# Usage: ./deploy.sh [namespace] [environment]

set -e

NAMESPACE=${1:-predator-analytics}
ENVIRONMENT=${2:-production}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Deploying Predator Analytics to Kubernetes"
echo "   Namespace: $NAMESPACE"
echo "   Environment: $ENVIRONMENT"
echo ""

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed"
    exit 1
fi

# Check cluster connection
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Cannot connect to Kubernetes cluster"
    exit 1
fi

echo "✅ Connected to Kubernetes cluster"
kubectl cluster-info | head -n 2

echo ""
echo "📦 Applying Kubernetes manifests..."

# Apply in order of dependencies
echo "  → Creating namespace..."
kubectl apply -f "$SCRIPT_DIR/namespace.yaml"

echo "  → Waiting for namespace to be active..."
kubectl wait --for=jsonpath='{.status.phase}'=Active namespace/$NAMESPACE --timeout=30s || true

echo "  → Creating secrets..."
kubectl apply -f "$SCRIPT_DIR/secrets.yaml" -n $NAMESPACE

echo "  → Creating configmaps..."
kubectl apply -f "$SCRIPT_DIR/configmaps.yaml" -n $NAMESPACE

echo "  → Creating storage..."
kubectl apply -f "$SCRIPT_DIR/storage.yaml" -n $NAMESPACE

echo "  → Deploying databases..."
kubectl apply -f "$SCRIPT_DIR/postgres.yaml" -n $NAMESPACE
kubectl apply -f "$SCRIPT_DIR/redis.yaml" -n $NAMESPACE

echo "  → Waiting for PostgreSQL to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres -n $NAMESPACE --timeout=300s || true

echo "  → Waiting for Redis to be ready..."
kubectl wait --for=condition=ready pod -l app=redis -n $NAMESPACE --timeout=120s || true

echo "  → Deploying search services..."
kubectl apply -f "$SCRIPT_DIR/opensearch.yaml" -n $NAMESPACE
kubectl apply -f "$SCRIPT_DIR/qdrant.yaml" -n $NAMESPACE
kubectl apply -f "$SCRIPT_DIR/minio.yaml" -n $NAMESPACE

echo "  → Waiting for OpenSearch to be ready..."
kubectl wait --for=condition=ready pod -l app=opensearch -n $NAMESPACE --timeout=300s || true

echo "  → Deploying authentication..."
kubectl apply -f "$SCRIPT_DIR/keycloak.yaml" -n $NAMESPACE

echo "  → Deploying backend..."
kubectl apply -f "$SCRIPT_DIR/backend.yaml" -n $NAMESPACE
kubectl apply -f "$SCRIPT_DIR/celery.yaml" -n $NAMESPACE

echo "  → Waiting for Backend to be ready..."
kubectl wait --for=condition=ready pod -l app=backend -n $NAMESPACE --timeout=300s || true

echo "  → Deploying frontend..."
kubectl apply -f "$SCRIPT_DIR/frontend.yaml" -n $NAMESPACE

echo "  → Deploying monitoring..."
kubectl apply -f "$SCRIPT_DIR/monitoring.yaml" -n $NAMESPACE

echo "  → Deploying ML services..."
kubectl apply -f "$SCRIPT_DIR/ml-services.yaml" -n $NAMESPACE

echo "  → Creating scheduled jobs..."
kubectl apply -f "$SCRIPT_DIR/jobs.yaml" -n $NAMESPACE

echo "  → Configuring ingress..."
kubectl apply -f "$SCRIPT_DIR/ingress.yaml" -n $NAMESPACE

echo ""
echo "✅ Deployment completed!"
echo ""
echo "📊 Deployment status:"
kubectl get pods -n $NAMESPACE
echo ""
echo "🌐 Services:"
kubectl get svc -n $NAMESPACE
echo ""
echo "🔗 Ingress:"
kubectl get ingress -n $NAMESPACE

echo ""
echo "💡 Tips:"
echo "   - View logs: kubectl logs -f deployment/backend -n $NAMESPACE"
echo "   - Scale backend: kubectl scale deployment/backend --replicas=5 -n $NAMESPACE"
echo "   - Port-forward: kubectl port-forward svc/backend 8000:8000 -n $NAMESPACE"
echo "   - Delete all: kubectl delete namespace $NAMESPACE"
