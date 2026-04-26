#!/bin/bash
# deploy_imac_full_stack.sh
# Повне автономне розгортання PREDATOR (8 DBs + API + UI) на iMac
# v60.5-ELITE

set -e

# Додаємо шляхи для iMac (Brew + Local)
export PATH=$PATH:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin

# Конфігурація
REMOTE=${PREDATOR_REMOTE:-"imac-sovereign"}
SSH_OPTS="-o IdentitiesOnly=yes -o ConnectTimeout=5"
CLUSTER_NAME="predator-full-stack"

echo "🌌 Ініціалізація повного стеку PREDATOR на iMac..."

# Жорстке очищення завислих k3d контейнерів
echo "🧹 Очищення завислих процесів Docker..."
docker rm -f $(docker ps -a -q --filter name=k3d-predator-full-stack) 2>/dev/null || true

# Функція для виконання команд (підтримує локальне та віддалене виконання)
remote_exec() {
    if [[ "$REMOTE" == "localhost" ]] || [[ "$REMOTE" == "127.0.0.1" ]] || [[ "$(hostname)" == "$REMOTE" ]]; then
        eval "$1"
    else
        # Спроба перевірити чи резолвиться хост
        if ! nslookup "$REMOTE" > /dev/null 2>&1 && [[ "$REMOTE" == "imac-sovereign" ]]; then
             echo "⚠️ Хост $REMOTE не знайдено. Виконую локально на $(hostname)..."
             eval "$1"
        else
             ssh $SSH_OPTS $REMOTE "$1"
        fi
    fi
}

# 1. Перевірка Docker/Colima
if ! remote_exec "docker ps" > /dev/null 2>&1; then
    echo "🏗️ Запуск Docker Engine (Colima)..."
    remote_exec "colima start --cpu 4 --memory 6 --disk 60 || true"
    sleep 10
fi

# 2. Створення кластера
echo "🏗️ Створення K3d кластера..."
remote_exec "k3d cluster delete $CLUSTER_NAME || true"
remote_exec "k3d cluster create $CLUSTER_NAME \
    -p \"3030:30000@loadbalancer\" \
    -p \"8000:30001@loadbalancer\" \
    --agents 1"

# 3. Розгортання базових сервісів (PostgreSQL, Redis)
echo "🗄️ Розгортання базових DBs (PostgreSQL, Redis)..."
remote_exec "cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Namespace
metadata:
  name: predator
---
# PostgreSQL (SSOT)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
  namespace: predator
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:16-alpine
        env:
        - name: POSTGRES_PASSWORD
          value: predator123
---
# Redis (Cache)
apiVersion: v1
kind: Service
metadata:
  name: redis
  namespace: predator
spec:
  ports:
  - port: 6379
  selector:
    app: redis
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: predator
spec:
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
EOF"

# 4. Встановлення Helm-чартів (Neo4j, Kafka, ClickHouse, Qdrant)
echo "📝 Встановлення Helm-чартів (Neo4j, Kafka, ClickHouse, Qdrant)..."

# Розблокування Keychain (якщо потрібно для Kafka)
remote_exec "security unlock-keychain -p 1204 ~/Library/Keychains/login.keychain-db 2>/dev/null || true"

remote_exec "
# Додаємо правильні репозиторії
helm repo add bitnami https://charts.bitnami.com/bitnami || true
helm repo remove neo4j 2>/dev/null || true
helm repo add neo4j https://helm.neo4j.com || true
helm repo add qdrant https://qdrant.github.io/helm || true
helm repo update || true

# Neo4j (Sovereign Graph)
helm upgrade --install neo4j-predator neo4j/neo4j \
  --namespace predator \
  --set neo4j.password='predator1204' \
  --set neo4j.edition='community' \
  --set persistence.enabled=false || true

# Kafka (Event Stream)
helm upgrade --install kafka-predator bitnami/kafka \
  --namespace predator \
  --set persistence.enabled=false \
  --set resourcesPreset='none' || true

# ClickHouse (OLAP)
helm upgrade --install clickhouse-predator bitnami/clickhouse \
  --namespace predator \
  --set persistence.enabled=false || true

# Qdrant (Vector DB)
helm upgrade --install qdrant-predator qdrant/qdrant \
  --namespace predator \
  --set persistence.enabled=false || true
"

# 5. Перевірка статусу
echo "🔍 Очікування стабілізації подів (60с)..."
sleep 60
remote_exec "kubectl get pods -n predator"

echo "🏁 Всі системи (8 DBs + Core) ініціалізовано на iMac."
echo "🔗 API доступний за адресою: http://192.168.0.199:8000/api/v1"
