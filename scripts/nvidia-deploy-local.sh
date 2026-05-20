#!/bin/bash
# =============================================================================
# NVIDIA Server Local Deploy — PREDATOR Analytics v65.7-ELITE
# =============================================================================
# Виконувати НА NVIDIA сервері (194.177.1.240).
# Ручний деплой останньої версії з main гілки.
#
# Використання:
#   cd ~/predator-analytics
#   bash scripts/nvidia-deploy-local.sh
# =============================================================================

set -euo pipefail

REPO_DIR="${REPO_DIR:-$HOME/predator-analytics}"
NAMESPACE="${NAMESPACE:-predator-nvidia}"
APP_NAME="${APP_NAME:-predator-nvidia-elite}"
HELM_TIMEOUT="${HELM_TIMEOUT:-10m}"

echo "=== PREDATOR NVIDIA Local Deploy ==="
echo "Repo: $REPO_DIR"
echo "Namespace: $NAMESPACE"
echo ""

# 1. Перевірити директорію
if [ ! -d "$REPO_DIR/.git" ]; then
    echo "❌ Git repo не знайдено в $REPO_DIR"
    echo "Клонувати: git clone https://github.com/dima1203oleg/predator-analytics.git $REPO_DIR"
    exit 1
fi

cd "$REPO_DIR"

# 2. Pull останніх змін
echo "[1/6] git pull..."
git fetch origin
git checkout main
git pull origin main

# 3. Перевірити k3s/kubectl
echo "[2/6] Перевірка kubectl..."
kubectl version --client || (echo "❌ kubectl не встановлено"; exit 1)
kubectl cluster-info || (echo "⚠️ k3s можливо не запущено"; systemctl start k3s 2>/dev/null || true)

# 4. Перевірити Helm
echo "[3/6] Перевірка Helm..."
helm version --short || (echo "❌ Helm не встановлено"; exit 1)

# 5. Застосувати ArgoCD manifest (якщо є ArgoCD)
echo "[4/6] ArgoCD sync..."
if kubectl get ns argocd &>/dev/null; then
    kubectl apply -f deploy/argocd/predator-nvidia.yaml -n argocd || true
    kubectl patch application "$APP_NAME" -n argocd \
        --type merge \
        -p '{"operation":{"sync":{"prune":true,"selfHeal":true}}}' 2>/dev/null || true
    echo "✅ ArgoCD sync запущено"
else
    echo "⚠️ ArgoCD namespace не знайдено — виконуємо helm upgrade"
    
    # 5a. Helm install/upgrade
    helm upgrade --install "$APP_NAME" deploy/helm/predator \
        -f deploy/helm/predator/values.yaml \
        -f environments/nvidia/values.yaml \
        -n "$NAMESPACE" \
        --create-namespace \
        --wait --timeout "$HELM_TIMEOUT" || true
fi

# 6. Health check
echo "[5/6] Health check..."
sleep 5
kubectl get pods -n "$NAMESPACE" -o wide
kubectl get svc -n "$NAMESPACE"

# 7. Frontend URL
echo ""
echo "[6/6] Перевірка frontend..."
FRONTEND_IP=$(kubectl get svc -n "$NAMESPACE" -l app.kubernetes.io/component=frontend -o jsonpath='{.items[0].status.loadBalancer.ingress[0].ip}' 2>/dev/null || true)
FRONTEND_PORT=$(kubectl get svc -n "$NAMESPACE" -l app.kubernetes.io/component=frontend -o jsonpath='{.items[0].spec.ports[0].nodePort}' 2>/dev/null || true)

if [ -n "$FRONTEND_IP" ] && [ "$FRONTEND_IP" != "null" ]; then
    echo "✅ Frontend LoadBalancer: http://$FRONTEND_IP"
elif [ -n "$FRONTEND_PORT" ] && [ "$FRONTEND_PORT" != "null" ]; then
    echo "✅ Frontend NodePort: http://194.177.1.240:$FRONTEND_PORT"
else
    echo "ℹ️ Frontend доступний через kubectl port-forward:"
    echo "   kubectl port-forward -n $NAMESPACE svc/frontend 8080:80"
fi

echo ""
echo "=== Deploy завершено ==="
