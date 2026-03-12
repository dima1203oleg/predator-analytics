#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "📈 PREDATOR Analytics Frontend Scaling"
echo "======================================"
echo ""

# Check if cluster is running
if ! k3d cluster list | grep -q "predator-local"; then
    echo "❌ k3d cluster 'predator-local' is not running."
    exit 1
fi

kubectl config use-context k3d-predator-local

# Get current replica count
CURRENT_REPLICAS=$(kubectl get deployment -n predator predator-frontend -o jsonpath='{.spec.replicas}')
echo "Current replicas: $CURRENT_REPLICAS"
echo ""

# Show options
echo "Select scaling option:"
echo "1) Scale to 1 replica (minimum)"
echo "2) Scale to 2 replicas (default)"
echo "3) Scale to 3 replicas"
echo "4) Scale to 5 replicas (maximum)"
echo "5) Custom number"
echo "6) View HPA status"
echo "7) Exit"
echo ""

read -p "Enter choice (1-7): " choice

case $choice in
    1)
        echo "Scaling to 1 replica..."
        kubectl scale deployment predator-frontend -n predator --replicas=1
        echo "✅ Scaled to 1 replica"
        ;;
    2)
        echo "Scaling to 2 replicas..."
        kubectl scale deployment predator-frontend -n predator --replicas=2
        echo "✅ Scaled to 2 replicas"
        ;;
    3)
        echo "Scaling to 3 replicas..."
        kubectl scale deployment predator-frontend -n predator --replicas=3
        echo "✅ Scaled to 3 replicas"
        ;;
    4)
        echo "Scaling to 5 replicas..."
        kubectl scale deployment predator-frontend -n predator --replicas=5
        echo "✅ Scaled to 5 replicas"
        ;;
    5)
        read -p "Enter desired number of replicas: " replicas
        if [[ $replicas =~ ^[0-9]+$ ]]; then
            echo "Scaling to $replicas replicas..."
            kubectl scale deployment predator-frontend -n predator --replicas=$replicas
            echo "✅ Scaled to $replicas replicas"
        else
            echo "❌ Invalid input"
            exit 1
        fi
        ;;
    6)
        echo ""
        echo "📊 HPA Status:"
        if kubectl get hpa -n predator predator-frontend > /dev/null 2>&1; then
            kubectl get hpa -n predator predator-frontend
            echo ""
            echo "📈 HPA Details:"
            kubectl describe hpa -n predator predator-frontend
        else
            echo "HPA not configured"
        fi
        exit 0
        ;;
    7)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "⏳ Waiting for deployment to update..."
sleep 2

echo ""
echo "📊 Deployment status:"
kubectl get deployment -n predator predator-frontend
echo ""
echo "📋 Pod status:"
kubectl get pods -n predator -l app=frontend -o wide
