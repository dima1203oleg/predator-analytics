#!/bin/bash
# Predator v45 | Neural Analytics- Remote Build & Deploy (FULL STACK)
# Цей скрипт оновлює Frontend (UI) та Backend (API Gateway)

SERVER="predator-server"
REMOTE_BASE="/home/dima/predator-analytics"

# Paths
LOCAL_UI="/Users/dima-mac/Documents/Predator_21/apps/predator-analytics-ui"
REMOTE_UI="$REMOTE_BASE/apps/predator-analytics-ui"

LOCAL_API="/Users/dima-mac/Documents/Predator_21/services/api-gateway"
REMOTE_API="$REMOTE_BASE/services/api-gateway"

DOCKER_COMPOSE="/Users/dima-mac/Documents/Predator_21/docker-compose.prod.yml"

echo "🚀 ЗАПУСК ПОВНОГО ДЕПЛОЮ (V45)..."

# 1. Connectivity Check
if ! ssh -q -o ConnectTimeout=5 "$SERVER" exit; then
    echo "⚠️ СЕРВЕР НЕДОСТУПНИЙ. Перевірте SSH підключення."
    exit 1
fi

ssh "$SERVER" "mkdir -p $REMOTE_BASE/services $REMOTE_BASE/apps"

# 2. Sync Configuration (Docker Compose)
echo "📄 Оновлення конфігурації..."
scp "$DOCKER_COMPOSE" "$SERVER:$REMOTE_BASE/docker-compose.prod.yml"

if [ -f "/Users/dima-mac/Documents/Predator_21/nginx.simple.conf" ]; then
    ssh "$SERVER" "mkdir -p $REMOTE_BASE/docker"
    scp "/Users/dima-mac/Documents/Predator_21/nginx.simple.conf" "$SERVER:$REMOTE_BASE/docker/nginx.simple.conf"
fi

# 3. Backend Deployment (API Gateway)
echo "🐍 Синхронізація Backend (API Gateway)..."
rsync -avz --quiet \
    --exclude '__pycache__' \
    --exclude '.venv' \
    --exclude 'venv' \
    --exclude '.git' \
    --exclude '.DS_Store' \
    "$LOCAL_API/" "$SERVER:$REMOTE_API/"

echo "🔄 Перезапуск Backend (це займе час для ребілду)..."
# We restart api-gateway in background or foreground? Let's do detached but build first.
# Note: assuming other services (db, redis) are already running via the same compose file.
ssh "$SERVER" "cd $REMOTE_BASE && docker-compose -f docker-compose.prod.yml up -d --build api-gateway"


# 4. Frontend Deployment
echo "⚛️ Синхронізація Frontend..."
rsync -avz --quiet \
    --exclude 'node_modules' \
    --exclude 'dist' \
    --exclude '.git' \
    --exclude '.DS_Store' \
    "$LOCAL_UI/" "$SERVER:$REMOTE_UI/"

# Clean old dist using Docker to bypass permission issues (files owned by root)
echo "🧹 Очистка старої збірки (dist)..."
ssh "$SERVER" "docker run --rm -v $REMOTE_UI:/app alpine rm -rf /app/dist"

echo "🏗️ Збірка Frontend на сервері..."
ssh "$SERVER" "docker run --rm \
    -v $REMOTE_UI:/app \
    -w /app \
    node:20-alpine \
    sh -c 'npm install --silent --no-audit --no-fund && npm run build'"

if [ $? -ne 0 ]; then
    echo "❌ ПОМИЛКА ЗБІРКИ FRONTEND!"
    exit 1
fi

# 5. Restart Frontend Server (Nginx container)
echo "🔄 Перезапуск Frontend..."
ssh "$SERVER" "docker kill predator-fixed-frontend 2>/dev/null; docker rm predator-fixed-frontend 2>/dev/null"
ssh "$SERVER" "docker run -d --name predator-fixed-frontend \
    --restart unless-stopped \
    -p 8080:80 \
    -v $REMOTE_UI/dist:/usr/share/nginx/html:ro \
    -v $REMOTE_BASE/docker/nginx.simple.conf:/etc/nginx/nginx.conf:ro \
    nginx:alpine"

echo " "
echo "🎉 DEPLOY COMPLETED SUCCESSFULLY!"
echo "👉 Parsers: https://jolyn-bifid-eligibly.ngrok-free.dev/parsers"
echo "👉 Evolution: https://jolyn-bifid-eligibly.ngrok-free.dev/evolution"
