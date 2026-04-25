#!/bin/bash
# deploy_imac_sovereign.sh
# Автоматизоване розгортання PREDATOR на iMac (Sovereign Node)

set -e

REMOTE="dmytrokizima@192.168.0.199"
CLUSTER_NAME="predator-sovereign"

echo "🚀 Починаю автономне розгортання на iMac ($REMOTE)..."

# 1. Перевірка Docker
if ! ssh $REMOTE "docker ps" > /dev/null 2>&1; then
    echo "❌ Docker не запущений на iMac. Спробую запустити colima..."
    ssh $REMOTE "colima start --cpu 4 --memory 8 --disk 60 || echo 'Colima failure'"
fi

# 2. Видалення старого кластера якщо є
ssh $REMOTE "k3d cluster delete $CLUSTER_NAME || true"

# 3. Створення нового кластера з відкритими портами
echo "🏗️ Створюю K3d кластер..."
ssh $REMOTE "k3d cluster create $CLUSTER_NAME \
    -p \"3030:30000@loadbalancer\" \
    -p \"8000:30001@loadbalancer\" \
    --agents 1"

# 4. Підготовка чартів (локально)
echo "📦 Оновлюю залежності Helm..."
helm dependency update deploy/helm/predator/

# 5. Синхронізація чартів та маніфестів
echo "📂 Синхронізація чартів на iMac..."
ssh $REMOTE "mkdir -p ~/predator-deploy/helm"
rsync -avz deploy/helm/predator $REMOTE:~/predator-deploy/helm/

# 6. Розгортання через Helm
echo "🚀 Розгортаю сервіси PREDATOR (v60.5-ELITE)..."
ssh $REMOTE "helm upgrade --install predator ~/predator-deploy/helm/predator \
    --namespace predator --create-namespace \
    -f ~/predator-deploy/helm/predator/values-imac.yaml"

# 6. Тестування доступності API
echo "🔍 Тестування API-шлюзу..."
sleep 15
if curl -s http://192.168.0.199:8000/api/v1/health | grep "status" > /dev/null; then
    echo "✅ Backend доступний на iMac!"
else
    echo "⚠️ Backend ще піднімається або конфігурація потребує перевірки."
fi

echo "🏁 Автономне розгортання завершено (Sovereign Node Ready)."
