#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"

echo "🚀 [1/6] Starting local k3d cluster..."
k3d cluster create predator-local \
  -p "80:80@loadbalancer" \
  -p "443:443@loadbalancer" \
  -p "3030:3030@loadbalancer" \
  --k3s-arg "--disable=traefik@server:0" \
  2>/dev/null || k3d cluster start predator-local

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
echo "📊 Check deployment status:"
echo "   kubectl get all -n predator"
echo "   kubectl logs -n predator -l app=frontend -f"
echo ""
echo "🛑 To stop the cluster:"
echo "   k3d cluster stop predator-local"
echo ""
echo "🗑️  To delete the cluster:"
echo "   k3d cluster delete predator-local"
echo "═══════════════════════════════════════════════════════════════"
