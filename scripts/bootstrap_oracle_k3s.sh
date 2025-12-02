#!/bin/bash

# ============================================================================
# Bootstrap script для Oracle Cloud (cloud-canary)
# Predator Analytics v18.x - GitOps Multi-Env Deployment
# ============================================================================
# Цей скрипт:
# 1. Встановлює k3s кластер
# 2. Встановлює ArgoCD
# 3. Застосовує predator-oracle Application
# ============================================================================
# ЗАПУСКАТИ НА ORACLE VM з sudo!
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║  Predator Analytics - Oracle Bootstrap (cloud-canary)           ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# Перевірка sudo
if [ "$EUID" -ne 0 ]; then
    echo "❌ Цей скрипт потрібно запускати з sudo"
    exit 1
fi

# ============================================================================
# 1. Перевірка ресурсів
# ============================================================================
echo "🔍 Перевірка ресурсів..."

TOTAL_MEM=$(free -m | awk '/^Mem:/{print $2}')
TOTAL_CPU=$(nproc)

echo "  ℹ️  RAM: ${TOTAL_MEM}MB, CPU: ${TOTAL_CPU} cores"

if [ "$TOTAL_MEM" -lt 1024 ]; then
    echo "  ⚠️  Мало пам'яті (<1GB). Canary режим може бути повільним."
fi

# ============================================================================
# 2. Встановлення k3s (легка версія для обмежених ресурсів)
# ============================================================================
echo ""
echo "📦 Перевірка та встановлення k3s..."

if ! command -v k3s &> /dev/null; then
    echo "  → Встановлюю k3s (без traefik для економії ресурсів)..."
    curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="--disable traefik" sh -
    sleep 10
    echo "  ✓ k3s встановлено"
else
    echo "  ✓ k3s вже встановлено"
fi

# Налаштування kubectl
export KUBECONFIG=/etc/rancher/k3s/k3s.yaml

echo "  → Перевірка статусу k3s..."
systemctl status k3s --no-pager | head -5 || true

# ============================================================================
# 3. Встановлення ArgoCD
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
# 4. Застосування ArgoCD Application для Oracle
# ============================================================================
echo ""
echo "📋 Застосування predator-oracle Application..."

if [ -f "$REPO_ROOT/argocd/predator-oracle.yaml" ]; then
    k3s kubectl apply -f "$REPO_ROOT/argocd/predator-oracle.yaml"
    echo "  ✓ Application predator-oracle застосовано"
else
    echo "  ⚠️  Файл argocd/predator-oracle.yaml не знайдено"
fi

# ============================================================================
# 5. Збереження kubeconfig
# ============================================================================
echo ""
echo "💾 Збереження kubeconfig..."

cp /etc/rancher/k3s/k3s.yaml "$REPO_ROOT/kubeconfig-oracle.yaml"

# Отримуємо публічний IP (Oracle Cloud)
PUBLIC_IP=$(curl -s http://169.254.169.254/opc/v1/instance/metadata/publicIp 2>/dev/null || hostname -I | awk '{print $1}')
sed -i "s/127.0.0.1/$PUBLIC_IP/g" "$REPO_ROOT/kubeconfig-oracle.yaml"

echo "  ✓ Збережено у kubeconfig-oracle.yaml"
echo "  ℹ️  Скопіюйте цей файл на MacBook для віддаленого доступу"

# ============================================================================
# 6. Відкриття портів у iptables (Oracle Cloud)
# ============================================================================
echo ""
echo "🔥 Налаштування firewall..."

# Oracle Cloud часто блокує порти через iptables
if command -v iptables &> /dev/null; then
    iptables -I INPUT -p tcp --dport 6443 -j ACCEPT 2>/dev/null || true
    iptables -I INPUT -p tcp --dport 8080 -j ACCEPT 2>/dev/null || true
    iptables -I INPUT -p tcp --dport 80 -j ACCEPT 2>/dev/null || true
    iptables -I INPUT -p tcp --dport 443 -j ACCEPT 2>/dev/null || true
    echo "  ✓ Порти відкриті (6443, 8080, 80, 443)"
fi

# ============================================================================
# 7. Отримання admin-пароля ArgoCD
# ============================================================================
echo ""
echo "🔐 Отримання admin-пароля ArgoCD..."

ARGOCD_PASSWORD=$(k3s kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d 2>/dev/null || echo "")

# ============================================================================
# 8. Підсумок
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
echo "   kubectl port-forward svc/predator-frontend -n predator-oracle 8083:80"
echo "   Відкрити: http://localhost:8083"
echo ""
echo "📌 Kubeconfig для MacBook:"
echo "   scp $REPO_ROOT/kubeconfig-oracle.yaml user@macbook:~/kubeconfig-oracle.yaml"
echo ""
echo "⚠️  Пам'ятайте: Oracle Free Tier має обмежені ресурси!"
echo "   Це canary-середовище для перевірки роботи з малими ресурсами."
echo ""