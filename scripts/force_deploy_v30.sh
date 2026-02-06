#!/bin/bash
# PREDATOR V30 - FORCE UPDATE SCRIPT
# Цей скрипт ПРИМУСОВО оновлює головний контейнер фронтенду на сервері до версії v30.

SERVER="predator-server"
REMOTE_BASE="/home/dima/predator-analytics"
REMOTE_DIST="$REMOTE_BASE/apps/predator-analytics-ui/dist"
LOCAL_DIST="/Users/dima-mac/Documents/Predator_21/apps/predator-analytics-ui/dist"
LOCAL_PROJECT="/Users/dima-mac/Documents/Predator_21/apps/predator-analytics-ui"

echo "🚀 ПОЧАТОК РОЗГОРТАННЯ PREDATOR V30 (CU-PIE EDITION)..."

# 1. Build Local
echo "📦 Збірка v30 локально..."
cd "$LOCAL_PROJECT" && npm run build

# 2. Upload
echo "📤 Завантаження файлів на сервер..."
ssh "$SERVER" "mkdir -p $REMOTE_DIST"
rsync -avz --delete "$LOCAL_DIST/" "$SERVER:$REMOTE_DIST/"

# 3. Nginx Config
echo "⚙️ Оновлення конфігурації Nginx..."
scp "/Users/dima-mac/Documents/Predator_21/nginx.simple.conf" "$SERVER:$REMOTE_BASE/docker/nginx.simple.conf"

# 4. SWAP CONTAINERS
echo "🔄 ЗАМІНА КОНТЕЙНЕРІВ (V28 -> V30)..."
ssh "$SERVER" << 'EOF'
    # Stop old main frontend
    if docker ps | grep -q predator_frontend; then
        echo "🛑 Зупинка старого контейнера v28 (predator_frontend)..."
        docker stop predator_frontend
        docker rm predator_frontend
    fi

    # Also check for the image name just in case of inconsistency
    if docker ps | grep -q predator-analytics-frontend; then
        echo "🛑 Зупинка контейнера за ім'ям образу..."
        docker stop predator-analytics-frontend 2>/dev/null || true
        docker rm predator-analytics-frontend 2>/dev/null || true
    fi

    # Stop temp frontend if exists
    if docker ps -a | grep -q predator-fixed-frontend; then
        echo "🧹 Очищення тимчасового контейнера..."
        docker rm -f predator-fixed-frontend
    fi

    echo "▶️ Запуск PREDATOR V30..."
    docker run -d --name predator-analytics-frontend \
        --restart unless-stopped \
        -p 80:80 \
        -v /home/dima/predator-analytics/apps/predator-analytics-ui/dist:/usr/share/nginx/html:ro \
        -v /home/dima/predator-analytics/docker/nginx.simple.conf:/etc/nginx/nginx.conf:ro \
        nginx:alpine
EOF

echo "✅ УСПІШНО! PREDATOR V30 розгорнуто на головному порті (80)."
echo "🌐 Перевірте: https://jolyn-bifid-eligibly.ngrok-free.dev/"
