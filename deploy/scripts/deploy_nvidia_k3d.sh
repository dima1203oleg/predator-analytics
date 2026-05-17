#!/bin/bash
# ==============================================================================
# 🦅 PREDATOR Analytics v60.5-ELITE — NVIDIA Server Bootstrap (k3d + ArgoCD + GitOps)
# ==============================================================================
set -e

echo "🚀 [1/8] Перевірка та встановлення необхідних інструментів на сервері..."

# Перевірка Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Помилка: Docker не встановлений або не запущений! Будь ласка, встановіть Docker спочатку."
    exit 1
fi

# Встановлення k3d якщо немає
if ! command -v k3d &> /dev/null; then
    echo "📦 k3d не знайдено. Встановлюємо..."
    curl -s https://raw.githubusercontent.com/k3d-io/k3d/main/install.sh | TAG=v5.6.0 bash
else
    echo "✅ k3d вже встановлено: $(k3d --version | head -n1)"
fi

# Встановлення kubectl якщо немає
if ! command -v kubectl &> /dev/null; then
    echo "📦 kubectl не знайдено. Встановлюємо..."
    curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
    chmod +x ./kubectl
    sudo mv ./kubectl /usr/local/bin/kubectl
else
    echo "✅ kubectl вже встановлено"
fi

# Встановлення helm якщо немає
if ! command -v helm &> /dev/null; then
    echo "📦 helm не знайдено. Встановлюємо..."
    curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
else
    echo "✅ helm вже встановлено"
fi

echo "🚀 [2/8] Створення кластера k3d 'predator-nvidia'..."

if k3d cluster list | grep -q "predator-nvidia"; then
    echo "🔄 Кластер 'predator-nvidia' вже існує. Перезапускаємо..."
    k3d cluster start predator-nvidia
else
    echo "🏗️ Створення нового кластера k3d з прокиданням портів для NVIDIA сервера..."
    # Порти:
    # 3030 -> Фронтенд (на сервері)
    # 8000 -> Бекенд API
    # 9082 -> ArgoCD UI
    k3d cluster create predator-nvidia \
        --agents 1 \
        --servers 1 \
        -p "3030:3030@loadbalancer" \
        -p "8000:8000@loadbalancer" \
        -p "9082:8080@loadbalancer" \
        --k3s-arg "--disable=traefik@server:0"
fi

echo "🔄 [3/8] Налаштування контексту kubectl..."
kubectl config use-context k3d-predator-nvidia

echo "📦 [4/8] Встановлення ArgoCD..."
kubectl create namespace argocd 2>/dev/null || true
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

echo "⏳ Очікування готовності ArgoCD Server (це може зайняти до 2 хвилин)..."
kubectl wait --for=condition=available deployment -l app.kubernetes.io/name=argocd-server -n argocd --timeout=300s || true

echo "🔒 [5/8] Створення неймспейсу predator-prod..."
kubectl create namespace predator-prod 2>/dev/null || true

echo "🦅 [6/8] Застосування конфігурацій ArgoCD GitOps..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"

# Перевірка наявності файлів
if [ -f "$DEPLOY_DIR/argocd/appproject.yaml" ]; then
    kubectl apply -f "$DEPLOY_DIR/argocd/appproject.yaml"
    kubectl apply -f "$DEPLOY_DIR/argocd/predator-nvidia.yaml"
else
    echo "⚠️ Попередження: Не знайдено локальних файлів ArgoCD у репозиторії. Застосовуємо напряму з GitHub..."
    kubectl apply -f https://raw.githubusercontent.com/dima1203oleg/predator-analytics/main/deploy/argocd/appproject.yaml
    kubectl apply -f https://raw.githubusercontent.com/dima1203oleg/predator-analytics/main/deploy/argocd/predator-nvidia.yaml
fi

echo "⏳ [7/8] Ініціалізація GitOps синхронізації..."
sleep 10

echo "✅ [8/8] РОЗГОРТАННЯ ЗАВЕРШЕНО УСПІШНО!"
echo "========================================================================"
echo "🎉 PREDATOR Analytics v60.5-ELITE запущено через ArgoCD на NVIDIA!"
echo "========================================================================"
echo ""
echo "📍 Фронтенд на сервері: http://194.177.1.240:3030"
echo "📍 API Бекенду на сервері: http://194.177.1.240:8000/api/v1"
echo ""
echo "🔑 Пароль адміністратора ArgoCD (admin):"
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d && echo ""
echo ""
echo "🌐 ArgoCD Панель керування:"
echo "   http://194.177.1.240:9082"
echo ""
echo "💡 ДЛЯ ЛОКАЛЬНОЇ РОБОТИ З ФРОНТЕНДОМ НА MACBOOK:"
echo "   1. Переконайтеся, що ваш локальний файл '.env' або '.env.development' має:"
echo "      VITE_API_BASE_URL=http://194.177.1.240:8000"
echo "   2. Запустіть локальний фронтенд: npm run dev -- --port 3030"
echo "   3. Ваш локальний UI на Mac буде підключений до потужної бази та API на NVIDIA сервері!"
echo "========================================================================"
