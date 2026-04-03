#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"

echo "🔍 [0/6] Checking pre-requisites..."
if ! xcode-select -p >/dev/null 2>&1; then
  echo "⚠️  WARNING: Xcode Command Line Tools not detected!"
  echo "👉 Run: xcode-select --install"
  # Don't exit, maybe it is installed but not in path
fi

echo "🚀 [1/6] Starting local k3d cluster (RAM Optimized)..."
if k3d cluster list | grep -q "predator-local"; then
  echo "Cluster already exists, starting it..."
  k3d cluster start predator-local
else
  echo "Creating new cluster (1 server, 1 agent)..."
  k3d cluster create predator-local \
    --agents 1 \
    --servers 1 \
    -p "80:80@loadbalancer" \
    -p "443:443@loadbalancer" \
    -p "3030:3030@loadbalancer" \
    -v "predator-k3d-storage:/var/lib/rancher/k3s/storage@server:0" \
    --k3s-arg "--disable=traefik@server:0"
fi

echo "🔄 [2/6] Switching kubectl context..."
kubectl config use-context k3d-predator-local

echo "📦 [3/6] Installing ArgoCD..."
kubectl create namespace argocd 2>/dev/null || true
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

echo "⏳ Waiting for ArgoCD server to be ready..."
kubectl wait --for=condition=available deployment -l app.kubernetes.io/name=argocd-server -n argocd --timeout=300s 2>/dev/null || true

echo "🔒 [4/6] Creating predator namespace and applying ArgoCD Application..."
kubectl create namespace predator 2>/dev/null || true
kubectl apply -f "$DEPLOY_DIR/argocd/application.yaml"

echo "🔄 [5/6] Waiting for ArgoCD to sync the application..."
sleep 5

echo "✅ [6/6] Deployment complete!"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "🎉 PREDATOR Analytics v55 is deploying via ArgoCD!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "📍 Frontend URL:"
echo "   http://localhost:3030"
echo ""
echo "🔑 ArgoCD Admin Password:"
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d && echo ""
echo ""
echo "🌐 ArgoCD UI (port-forward):"
echo "   kubectl port-forward svc/argocd-server -n argocd 8080:443"
echo "   Then visit: https://localhost:8080"
echo ""
echo "📊 RAM Optimizations for 8GB Mac:"
echo "   1. alias k=kubectl (added to ~/.zshrc?)"
echo "   2. k3d cluster stop predator-local  # Stop when not in use"
echo "   3. k3d cluster start predator-local # Start when needed"
echo "   4. docker system prune -f           # Keep Docker clean"
echo ""
echo "📊 Check deployment status:"
echo "   kubectl get all -n predator"
echo "   kubectl logs -n predator -l app=frontend -f"
echo "═══════════════════════════════════════════════════════════════"
