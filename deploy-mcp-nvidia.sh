#!/bin/bash

###############################################################################
# MCP Platform - Деплой на NVIDIA K3s сервер
# Використовує: kubeconfig_remote, Helm, kubectl
###############################################################################

set -e

# Конфігурація
NVIDIA_IP="34.185.226.240"
NVIDIA_PORT="6443"
KUBECONFIG_REMOTE="/Users/dima-mac/Documents/Predator_21/kubeconfig_remote"
MCP_PLATFORM_DIR="/Users/dima-mac/Documents/Predator_21/mcp-platform"
REGISTRY="ghcr.io"
ORG="dima1203oleg"
IMAGE_NAME="mcp-platform"
VERSION="latest"
NAMESPACE="mcp-platform"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  MCP Platform - Деплой на NVIDIA K3s                       ║"
echo "║  Server: $NVIDIA_IP                               ║"
echo "╚════════════════════════════════════════════════════════════╝"

# 1. Перевірка передумов
echo ""
echo "📋 Крок 1: Перевірка передумов..."
command -v kubectl >/dev/null 2>&1 || { echo "❌ kubectl не знайдено"; exit 1; }
command -v helm >/dev/null 2>&1 || { echo "❌ helm не знайдено"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ docker не знайдено"; exit 1; }
[ -f "$KUBECONFIG_REMOTE" ] || { echo "❌ kubeconfig_remote не знайдено"; exit 1; }
echo "✅ Всі передумови встановлені"

# 2. Налаштування kubeconfig
echo ""
echo "📋 Крок 2: Налаштування kubeconfig для NVIDIA..."
export KUBECONFIG="$KUBECONFIG_REMOTE"
kubectl config use-context gke_project-b63e383c-4a98-418d-837_europe-west3_predator-cluster-v1 || \
  { echo "❌ Не вдалось встановити контекст K8s"; exit 1; }
echo "✅ Контекст налаштований: $(kubectl config current-context)"

# 3. Перевірка з'єднання з K3s
echo ""
echo "📋 Крок 3: Перевірка з'єднання з K3s сервером..."
if kubectl cluster-info >/dev/null 2>&1; then
  echo "✅ Підключено до K3s: $(kubectl cluster-info | grep 'Kubernetes master')"
else
  echo "❌ Не вдалось підключитись до K3s сервера"
  exit 1
fi

# 4. Побудування Docker образу
echo ""
echo "📋 Крок 4: Побудування Docker образу..."
cd "$MCP_PLATFORM_DIR"
if docker build -t "$REGISTRY/$ORG/$IMAGE_NAME:$VERSION" .; then
  echo "✅ Docker образ побудований: $REGISTRY/$ORG/$IMAGE_NAME:$VERSION"
else
  echo "❌ Помилка при побудуванні образу"
  exit 1
fi

# 5. Push до реєстру
echo ""
echo "📋 Крок 5: Підготовка образу для K3s..."
echo "⚠️  Використовуємо локально збудований образ (без push до GHCR)"
echo "✅ Образ готовий до використання: $REGISTRY/$ORG/$IMAGE_NAME:$VERSION"

# 6. Створення namespace
echo ""
echo "📋 Крок 6: Створення namespace..."
kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -
echo "✅ Namespace створений: $NAMESPACE"

# 7. Встановлення Helm-чарту
echo ""
echo "📋 Крок 7: Встановлення MCP Platform через Helm..."
helm upgrade --install "$IMAGE_NAME" ./helm/mcp \
  --namespace "$NAMESPACE" \
  --set image.repository="$REGISTRY/$ORG/$IMAGE_NAME" \
  --set image.tag="$VERSION" \
  --set image.pullPolicy="Never" \
  --set replicaCount=1 \
  --set service.type="LoadBalancer" \
  --set service.port=8000 \
  --set resources.requests.cpu="250m" \
  --set resources.requests.memory="256Mi" \
  --set resources.limits.cpu="1000m" \
  --set resources.limits.memory="1Gi" \
  --wait \
  --timeout 5m

if [ $? -eq 0 ]; then
  echo "✅ Helm-чарт встановлений"
else
  echo "❌ Помилка при встановленні Helm-чарту"
  exit 1
fi

# 8. Перевірка статусу подів
echo ""
echo "📋 Крок 8: Перевірка статусу подів..."
sleep 3
echo ""
kubectl -n "$NAMESPACE" get pods
echo ""

# Очікування на готовність подів
echo "⏳ Очікування на готовність подів (до 3 хв)..."
kubectl -n "$NAMESPACE" wait --for=condition=ready pod \
  -l app="$IMAGE_NAME" --timeout=180s 2>/dev/null || echo "⚠️  Деякі поди можуть ще завантажуватись"

# 9. Отримання IP сервісу
echo ""
echo "📋 Крок 9: Отримання IP та портів сервісу..."
SERVICE_INFO=$(kubectl -n "$NAMESPACE" get svc "$IMAGE_NAME" -o jsonpath='{.status.loadBalancer.ingress[0].ip}:{.spec.ports[0].port}' 2>/dev/null)
if [ -z "$SERVICE_INFO" ]; then
  echo "ℹ️  LoadBalancer IP ще не призначений. Спробуємо ClusterIP..."
  SERVICE_IP=$(kubectl -n "$NAMESPACE" get svc "$IMAGE_NAME" -o jsonpath='{.spec.clusterIP}')
  echo "🔗 ClusterIP: $SERVICE_IP:8000"
  echo "   Для зовнішнього доступу: kubectl -n $NAMESPACE port-forward svc/$IMAGE_NAME 8000:8000"
else
  echo "🔗 LoadBalancer: http://$SERVICE_INFO"
fi

# 10. Тестування health endpoints
echo ""
echo "📋 Крок 10: Тестування health endpoints..."

POD_NAME=$(kubectl -n "$NAMESPACE" get pods -l app="$IMAGE_NAME" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
if [ -n "$POD_NAME" ]; then
  echo "Під: $POD_NAME"
  
  # Port-forward для локального тестування
  echo "⏳ Налаштування port-forward (фонова задача)..."
  kubectl -n "$NAMESPACE" port-forward "pod/$POD_NAME" 8000:8000 &>/dev/null &
  PF_PID=$!
  sleep 2
  
  # Тести
  echo ""
  echo "🧪 Тест /healthz:"
  if curl -s http://localhost:8000/healthz; then
    echo -e "\n✅ /healthz OK"
  else
    echo -e "\n❌ /healthz Failed"
  fi
  
  echo ""
  echo "🧪 Тест /readyz:"
  if curl -s http://localhost:8000/readyz; then
    echo -e "\n✅ /readyz OK"
  else
    echo -e "\n❌ /readyz Failed"
  fi
  
  echo ""
  echo "🧪 Тест /info:"
  if curl -s http://localhost:8000/info | head -20; then
    echo "✅ /info OK"
  else
    echo "❌ /info Failed"
  fi
  
  # Зупинити port-forward
  kill $PF_PID 2>/dev/null || true
  
  # Логи
  echo ""
  echo "📋 Логи подів (останні 20 рядків):"
  kubectl -n "$NAMESPACE" logs "pod/$POD_NAME" --tail=20 2>/dev/null || echo "⚠️  Логи ще не доступні"
else
  echo "⚠️  Жодного пода не знайдено. Спробуємо через 10 секунд..."
  sleep 10
  kubectl -n "$NAMESPACE" logs -l app="$IMAGE_NAME" --tail=20 2>/dev/null || echo "⚠️  Логи ще не доступні"
fi

# Підсумок
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    ДЕПЛОЙ ЗАВЕРШЕНО                        ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║ Namespace:        $NAMESPACE"
echo "║ Image:            $REGISTRY/$ORG/$IMAGE_NAME:$VERSION"
echo "║ K3s Server:       $NVIDIA_IP"
echo "║ Kubernetes:       $(kubectl version --short 2>/dev/null | head -1)"
echo "║                                                            ║"
echo "║ Команди для управління:                                   ║"
echo "║  • Статус подів:                                          ║"
echo "║    kubectl -n $NAMESPACE get pods                 ║"
echo "║  • Логи:                                                  ║"
echo "║    kubectl -n $NAMESPACE logs -f deploy/$IMAGE_NAME ║"
echo "║  • Port-forward:                                          ║"
echo "║    kubectl -n $NAMESPACE port-forward svc/$IMAGE_NAME 8000:8000 ║"
echo "║  • Видалення:                                             ║"
echo "║    helm uninstall $IMAGE_NAME -n $NAMESPACE"
echo "║                                                            ║"
echo "║ 🎯 API доступний на: http://localhost:8000 (після port-forward) ║"
echo "╚════════════════════════════════════════════════════════════╝"
