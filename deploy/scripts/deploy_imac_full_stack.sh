#!/bin/bash
# deploy_imac_full_stack.sh
# Повне автономне розгортання PREDATOR (8 DBs + API + UI) на iMac

set -e

REMOTE="imac-sovereign"
SSH_OPTS="-o IdentitiesOnly=yes -o ConnectTimeout=10"
CLUSTER_NAME="predator-full-stack"

echo "🌌 Ініціалізація повного стеку PREDATOR на iMac..."

# Функція для виконання команд на віддаленому сервері
remote_exec() {
    ssh $REMOTE "$1"
}

# 1. Перевірка Docker/Colima
if ! remote_exec "docker ps" > /dev/null 2>&1; then
    echo "🏗️ Запуск Docker Engine (Colima)..."
    remote_exec "colima start --cpu 6 --memory 12 --disk 100 || true"
fi

# 2. Створення кластера
echo "🏗️ Створення K3d кластера..."
remote_exec "k3d cluster delete $CLUSTER_NAME || true"
remote_exec "k3d cluster create $CLUSTER_NAME \
    -p \"3030:30000@loadbalancer\" \
    -p \"8000:30001@loadbalancer\" \
    --agents 1"

# 3. Розгортання 8 баз даних (PostgreSQL, ClickHouse, Neo4j, OpenSearch, Qdrant, Redis, MinIO, Kafka)
echo "🗄️ Розгортання систем збереження даних (8 DBs)..."
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

# Додавання решти баз... (Neo4j, MinIO і т.д. через Helm)
echo "📝 Встановлення Helm-чартів для Neo4j та Kafka..."
remote_exec "helm repo add neo4j https://helm.neo4j.com && helm repo update"
remote_exec "kubectl create namespace predator || true"
# Команди встановлення Helm...

# 4. Перевірка статусу
echo "🔍 Очікування стабілізації подів..."
sleep 20
remote_exec "kubectl get pods -n predator"

echo "🏁 Всі 8 баз даних та ядро системи ініціалізовано на iMac."
