#!/bin/bash

# ============================================================================
# Bootstrap script для MacBook (dev-local)
# Predator Analytics v18.x - GitOps Multi-Env Deployment
# ============================================================================
# Цей скрипт:
# 1. Встановлює minikube, kubectl, helm через Homebrew
# 2. Запускає локальний k8s кластер
# 3. Встановлює ArgoCD
# 4. Застосовує predator-macbook Application
# ============================================================================

set -e  # Вихід при помилці

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║  Predator Analytics - MacBook Bootstrap (dev-local)             ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# ============================================================================
# 1. Встановлення інструментів через Homebrew
# ============================================================================
echo "📦 Перевірка та встановлення інструментів..."

if ! command -v brew &> /dev/null; then
    echo "❌ Homebrew не встановлено. Встановіть: /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
    exit 1
fi

for tool in minikube kubectl helm; do
    if ! command -v $tool &> /dev/null; then
        echo "  → Встановлюю $tool..."
        brew install $tool
    else
        echo "  ✓ $tool вже встановлено"
    fi
done

# ============================================================================
# 2. Запуск minikube кластера
# ============================================================================
echo ""
echo "🚀 Запуск minikube кластера..."

# Визначаємо доступну пам'ять
DOCKER_RAM=$(docker system info --format '{{.MemTotal}}' 2>/dev/null | awk '{print int($1/1024/1024)}')
if [ -z "$DOCKER_RAM" ] || [ "$DOCKER_RAM" -lt 6000 ]; then
    RAM=3072
    echo "  ℹ️  Docker Desktop RAM: ${DOCKER_RAM:-unknown} MB → minikube з 3GB RAM"
else
    RAM=8192
    echo "  ℹ️  Docker Desktop RAM: $DOCKER_RAM MB → minikube з 8GB RAM"
fi

# Перевіряємо, чи кластер вже запущений
if minikube status 2>/dev/null | grep -q "Running"; then
    echo "  ✓ minikube кластер вже запущений"
else
    echo "  → Запускаю новий кластер..."
    minikube start --cpus=4 --memory=${RAM}mb --driver=docker || {
        echo ""
        echo "❌ Не вдалося запустити minikube."
        echo "   Спробуйте: minikube delete && minikube start --memory=3072mb"
        exit 1
    }
fi

# Збереження kubeconfig
echo ""
echo "💾 Збереження kubeconfig..."
cp ~/.kube/config "$REPO_ROOT/kubeconfig-mac.yaml"
echo "  ✓ Збережено у kubeconfig-mac.yaml"

# ============================================================================
# 3. Встановлення ArgoCD
# ============================================================================
echo ""
echo "🔧 Встановлення ArgoCD..."

kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -

echo "  → Завантаження ArgoCD manifests..."
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

echo "  → Очікування готовності ArgoCD..."
kubectl wait --for=condition=available --timeout=300s deployment/argocd-server -n argocd

# Health-check
echo "  → Перевірка HTTP-здоров'я ArgoCD..."
TRIES=15
SLEEP=5
HC_OK=0
for i in $(seq 1 "$TRIES"); do
    if kubectl -n argocd get pods -l app.kubernetes.io/name=argocd-server -o jsonpath='{.items[0].status.phase}' 2>/dev/null | grep -q "Running"; then
        HC_OK=1
        break
    fi
    echo "    чекаю готовності (спроба $i/$TRIES)..."
    sleep $SLEEP
done

if [ "$HC_OK" -eq 1 ]; then
    echo "  ✓ ArgoCD готовий до роботи"
else
    echo "  ⚠️  ArgoCD може бути ще не готовий, перевірте логи"
fi

# ============================================================================
# 4. Застосування ArgoCD Application для MacBook
# ============================================================================
echo ""
echo "📋 Застосування predator-macbook Application..."

if [ -f "$REPO_ROOT/argocd/predator-macbook.yaml" ]; then
    kubectl apply -f "$REPO_ROOT/argocd/predator-macbook.yaml"
    echo "  ✓ Application predator-macbook застосовано"
else
    echo "  ⚠️  Файл argocd/predator-macbook.yaml не знайдено"
fi

# ============================================================================
# 5. Отримання admin-пароля ArgoCD
# ============================================================================
echo ""
echo "🔐 Отримання admin-пароля ArgoCD..."

ARGOCD_PASSWORD=""
for s in argocd-initial-admin-secret argocd-secret; do
    if kubectl -n argocd get secret "$s" >/dev/null 2>&1; then
        for key in password admin.password; do
            val=$(kubectl -n argocd get secret "$s" -o jsonpath="{.data.$key}" 2>/dev/null || true)
            if [ -n "$val" ]; then
                ARGOCD_PASSWORD=$(echo "$val" | base64 --decode 2>/dev/null || true)
                break 2
            fi
        done
    fi
done

# ============================================================================
# 6. Підсумок
# ============================================================================
echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║  ✅ Bootstrap завершено успішно!                                 ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""
echo "📌 Доступ до ArgoCD UI:"
echo "   kubectl port-forward svc/argocd-server -n argocd 8080:443"
echo "   Відкрити: https://localhost:8080"
echo ""
echo "📌 Логін: admin"
if [ -n "$ARGOCD_PASSWORD" ]; then
    echo "📌 Пароль: $ARGOCD_PASSWORD"
else
    echo "📌 Пароль: kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' | base64 -d"
fi
echo ""
echo "📌 Доступ до Predator Frontend (після синхронізації):"
echo "   kubectl port-forward svc/predator-frontend -n predator-macbook 8081:80"
echo "   Відкрити: http://localhost:8081"
echo ""
echo "📌 Перевірка статусу:"
echo "   kubectl get applications -n argocd"
echo "   kubectl get pods -n predator-macbook"
echo ""