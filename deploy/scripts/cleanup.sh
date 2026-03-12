#!/bin/bash
set -e

echo "🗑️  PREDATOR Analytics Cleanup"
echo "============================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

read -p "Are you sure you want to cleanup? This will delete the k3d cluster and all data. (yes/no): " -r
echo
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Cleanup cancelled."
    exit 0
fi

echo ""
echo -e "${YELLOW}⚠️  Starting cleanup...${NC}"
echo ""

# Step 1: Delete Kubernetes resources
echo "📦 Deleting Kubernetes resources..."
if kubectl config current-context | grep -q "k3d-predator-local"; then
    echo "Deleting predator namespace..."
    kubectl delete namespace predator --ignore-not-found=true
    
    echo "Deleting argocd namespace..."
    kubectl delete namespace argocd --ignore-not-found=true
    
    echo "Deleting kube-system resources..."
    kubectl delete all --all -n kube-system --ignore-not-found=true
fi

echo -e "${GREEN}✅ Kubernetes resources deleted${NC}"
echo ""

# Step 2: Stop k3d cluster
echo "🛑 Stopping k3d cluster..."
if k3d cluster list | grep -q "predator-local"; then
    k3d cluster stop predator-local 2>/dev/null || true
    echo -e "${GREEN}✅ k3d cluster stopped${NC}"
else
    echo "k3d cluster not found"
fi

echo ""

# Step 3: Delete k3d cluster
echo "🗑️  Deleting k3d cluster..."
read -p "Delete k3d cluster 'predator-local'? (yes/no): " -r
echo
if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    k3d cluster delete predator-local 2>/dev/null || true
    echo -e "${GREEN}✅ k3d cluster deleted${NC}"
else
    echo "k3d cluster deletion skipped"
fi

echo ""

# Step 4: Clean Docker images
echo "🐳 Cleaning Docker images..."
read -p "Delete local Docker images? (yes/no): " -r
echo
if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    docker rmi predator-analytics-ui:local 2>/dev/null || true
    docker rmi predator-analytics-ui:test 2>/dev/null || true
    docker image prune -f
    echo -e "${GREEN}✅ Docker images cleaned${NC}"
else
    echo "Docker cleanup skipped"
fi

echo ""

# Step 5: Clean kubectl context
echo "🔐 Cleaning kubectl context..."
kubectl config delete-context k3d-predator-local 2>/dev/null || true
kubectl config delete-cluster k3d-predator-local 2>/dev/null || true
echo -e "${GREEN}✅ kubectl context cleaned${NC}"

echo ""
echo "======================================================"
echo -e "${GREEN}✅ Cleanup complete!${NC}"
echo ""
echo "📝 Summary:"
echo "   - Kubernetes resources deleted"
echo "   - k3d cluster stopped/deleted"
echo "   - Docker images cleaned"
echo "   - kubectl context cleaned"
echo ""
echo "To start fresh, run:"
echo "   ./quickstart.sh"
echo ""
