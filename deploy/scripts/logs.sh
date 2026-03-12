#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "📋 PREDATOR Analytics Frontend Logs"
echo "===================================="
echo ""

# Check if cluster is running
if ! k3d cluster list | grep -q "predator-local"; then
    echo "❌ k3d cluster 'predator-local' is not running."
    exit 1
fi

kubectl config use-context k3d-predator-local

# Show available options
echo "Select log source:"
echo "1) Frontend pods (all)"
echo "2) Frontend pod (latest)"
echo "3) Frontend deployment"
echo "4) ArgoCD server"
echo "5) All predator namespace"
echo "6) Exit"
echo ""

read -p "Enter choice (1-6): " choice

case $choice in
    1)
        echo ""
        echo "📊 Frontend pods logs (all):"
        kubectl logs -n predator -l app=frontend --all-containers=true --tail=100
        ;;
    2)
        echo ""
        echo "📊 Frontend pod logs (latest):"
        POD=$(kubectl get pod -n predator -l app=frontend -o jsonpath='{.items[0].metadata.name}')
        if [ -z "$POD" ]; then
            echo "No frontend pods found"
        else
            echo "Pod: $POD"
            kubectl logs -n predator "$POD" -f
        fi
        ;;
    3)
        echo ""
        echo "📊 Frontend deployment logs:"
        kubectl logs -n predator deployment/predator-frontend -f
        ;;
    4)
        echo ""
        echo "📊 ArgoCD server logs:"
        kubectl logs -n argocd deployment/argocd-server -f
        ;;
    5)
        echo ""
        echo "📊 All predator namespace logs:"
        kubectl logs -n predator --all-containers=true --tail=50 -f
        ;;
    6)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac
