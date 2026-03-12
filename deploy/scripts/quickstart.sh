#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"

echo "🚀 PREDATOR Analytics Frontend Quick Start"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Step 1: Check prerequisites
echo -e "${BLUE}[Step 1/4]${NC} Checking prerequisites..."
MISSING=0

for cmd in k3d kubectl helm docker git; do
    if ! command -v $cmd &> /dev/null; then
        echo "❌ $cmd not found. Please install it first."
        MISSING=1
    fi
done

if [ $MISSING -eq 1 ]; then
    echo ""
    echo "Please install missing tools and try again."
    exit 1
fi
echo -e "${GREEN}✅ All prerequisites installed${NC}"
echo ""

# Step 2: Create k3d cluster
echo -e "${BLUE}[Step 2/4]${NC} Setting up k3d cluster..."
if k3d cluster list | grep -q "predator-local"; then
    echo "Cluster 'predator-local' already exists. Starting it..."
    k3d cluster start predator-local 2>/dev/null || true
else
    echo "Creating new k3d cluster 'predator-local'..."
    "$SCRIPT_DIR/deploy_local_k3d.sh"
fi
echo -e "${GREEN}✅ k3d cluster ready${NC}"
echo ""

# Step 3: Sync frontend
echo -e "${BLUE}[Step 3/4]${NC} Deploying frontend..."
"$SCRIPT_DIR/sync_frontend_local.sh"
echo -e "${GREEN}✅ Frontend deployed${NC}"
echo ""

# Step 4: Verify deployment
echo -e "${BLUE}[Step 4/4]${NC} Verifying deployment..."
"$SCRIPT_DIR/verify_deployment.sh"
echo ""

echo "======================================================"
echo -e "${GREEN}✅ Quick start complete!${NC}"
echo ""
echo "🎉 Your PREDATOR Analytics frontend is ready!"
echo ""
echo "📍 Access frontend:"
echo "   http://localhost:3030"
echo ""
echo "📊 Useful commands:"
echo "   # View frontend pods"
echo "   kubectl get pods -n predator -l app=frontend"
echo ""
echo "   # View frontend logs"
echo "   kubectl logs -n predator -l app=frontend -f"
echo ""
echo "   # Watch deployment status"
echo "   ./watch_frontend.sh"
echo ""
echo "   # Restart frontend"
echo "   ./restart_frontend_local.sh"
echo ""
echo "   # Run end-to-end tests"
echo "   ./test_e2e.sh"
echo ""
echo "🔐 ArgoCD UI:"
echo "   kubectl port-forward svc/argocd-server -n argocd 8080:443"
echo "   Then visit: https://localhost:8080"
echo ""
echo "🛑 To stop the cluster:"
echo "   k3d cluster stop predator-local"
echo ""
echo "🗑️  To delete the cluster:"
echo "   k3d cluster delete predator-local"
echo ""
