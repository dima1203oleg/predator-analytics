#!/bin/bash

# ============================================================================
# Bootstrap script для NVIDIA Server (lab-gpu)
# Predator Analytics v19.0.0 - GitOps Multi-Env Deployment
# ============================================================================
# Цей скрипт:
# 1. Встановлює k3s кластер
# 2. Налаштовує NVIDIA Container Toolkit
# 3. Встановлює ArgoCD
# 4. Застосовує predator-nvidia Application
# 5. Додає лейбл gpu=true на ноду
# ============================================================================
# ЗАПУСКАТИ НА NVIDIA-СЕРВЕРІ з sudo!
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║  Predator Analytics - NVIDIA Bootstrap (lab-gpu)                ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# Перевірка sudo
if [ "$EUID" -ne 0 ]; then
    echo "❌ Цей скрипт потрібно запускати з sudo"
    exit 1
fi

# ============================================================================
# 1. Перевірка NVIDIA драйверів
# ============================================================================
echo "🔍 Перевірка NVIDIA драйверів..."

if command -v nvidia-smi &> /dev/null; then
    echo "  ✓ nvidia-smi знайдено"
    nvidia-smi --query-gpu=name,driver_version,memory.total --format=csv,noheader | head -1
else
    echo "  ⚠️  nvidia-smi не знайдено. Встановіть NVIDIA драйвери:"
    echo "     apt install nvidia-driver-535"
    echo ""
fi

# ============================================================================
# 2. Встановлення k3s
# ============================================================================
echo ""
echo "📦 Перевірка та встановлення k3s..."

if ! command -v k3s &> /dev/null; then
    echo "  → Встановлюю k3s..."
    curl -sfL https://get.k3s.io | sh -
    sleep 10
    echo "  ✓ k3s встановлено"
else
    echo "  ✓ k3s вже встановлено"
fi

# Налаштування kubectl
export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
alias kubectl='k3s kubectl'

echo "  → Перевірка статусу k3s..."
systemctl status k3s --no-pager | head -5 || true

# ============================================================================
# 3. Встановлення NVIDIA Container Toolkit (якщо є GPU)
# ============================================================================
if command -v nvidia-smi &> /dev/null; then
    echo ""
    echo "🎮 Налаштування NVIDIA Container Toolkit..."
    
    # Перевірка, чи вже встановлено
    if ! command -v nvidia-container-toolkit &> /dev/null; then
        echo "  → Встановлюю nvidia-container-toolkit..."
        
        # Додаємо репозиторій NVIDIA
        distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
        curl -s -L https://nvidia.github.io/libnvidia-container/gpgkey | apt-key add -
        curl -s -L https://nvidia.github.io/libnvidia-container/$distribution/libnvidia-container.list | \
            tee /etc/apt/sources.list.d/nvidia-container-toolkit.list
        
        apt-get update
        apt-get install -y nvidia-container-toolkit
        
        echo "  ✓ nvidia-container-toolkit встановлено"
    else
        echo "  ✓ nvidia-container-toolkit вже встановлено"
    fi
    
    # Налаштування containerd для k3s
    echo "  → Налаштування containerd для GPU..."
    nvidia-ctk runtime configure --runtime=containerd
    systemctl restart k3s
    sleep 5
fi

# ============================================================================
# 4. Додаємо лейбл gpu=true на ноду
# ============================================================================
echo ""
echo "🏷️  Додаємо лейбл gpu=true на ноду..."

NODE_NAME=$(k3s kubectl get nodes -o jsonpath='{.items[0].metadata.name}')
k3s kubectl label node "$NODE_NAME" gpu=true --overwrite
echo "  ✓ Лейбл gpu=true додано на ноду $NODE_NAME"

# ============================================================================
# 5. Встановлення ArgoCD
# ============================================================================
echo ""
echo "🔧 Встановлення ArgoCD..."

k3s kubectl create namespace argocd --dry-run=client -o yaml | k3s kubectl apply -f -

echo "  → Завантаження ArgoCD manifests..."
k3s kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

echo "  → Очікування готовності ArgoCD..."
k3s kubectl wait --for=condition=available --timeout=300s deployment/argocd-server -n argocd

echo "  ✓ ArgoCD готовий"

# ============================================================================
# 6. Застосування ArgoCD Application для NVIDIA
# ============================================================================
echo ""
echo "📋 Застосування predator-nvidia Application..."

if [ -f "$REPO_ROOT/argocd/predator-nvidia.yaml" ]; then
    k3s kubectl apply -f "$REPO_ROOT/argocd/predator-nvidia.yaml"
    echo "  ✓ Application predator-nvidia застосовано"
else
    echo "  ⚠️  Файл argocd/predator-nvidia.yaml не знайдено"
fi

# ============================================================================
# 7. Збереження kubeconfig
# ============================================================================
echo ""
echo "💾 Збереження kubeconfig..."

cp /etc/rancher/k3s/k3s.yaml "$REPO_ROOT/kubeconfig-nvidia.yaml"

# Отримуємо IP сервера
SERVER_IP=$(hostname -I | awk '{print $1}')
sed -i "s/127.0.0.1/$SERVER_IP/g" "$REPO_ROOT/kubeconfig-nvidia.yaml"

echo "  ✓ Збережено у kubeconfig-nvidia.yaml"
echo "  ℹ️  Скопіюйте цей файл на MacBook для віддаленого доступу"

# ============================================================================
# 8. Отримання admin-пароля ArgoCD
# ============================================================================
echo ""
echo "🔐 Отримання admin-пароля ArgoCD..."

ARGOCD_PASSWORD=$(k3s kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d 2>/dev/null || echo "")

# ============================================================================
# 9. Підсумок
# ============================================================================
echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║  ✅ Bootstrap завершено успішно!                                 ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""
echo "📌 Доступ до ArgoCD UI (з сервера):"
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
echo "   kubectl port-forward svc/predator-frontend -n predator-nvidia 8082:80"
echo "   Відкрити: http://localhost:8082"
echo ""
echo "📌 Перевірка GPU:"
echo "   kubectl get nodes -o=custom-columns='NAME:.metadata.name,GPU:.metadata.labels.gpu'"
echo ""
echo "📌 Kubeconfig для MacBook:"
echo "   scp $REPO_ROOT/kubeconfig-nvidia.yaml user@macbook:~/kubeconfig-nvidia.yaml"
echo ""