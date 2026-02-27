#!/bin/bash
# Predator v45 | Neural Analytics- Dockerized Build & Deploy
# Цей скрипт використовує Docker для збірки, щоб уникнути залежності від локального npm.

SERVER="predator-server"
REMOTE_BASE="/home/dima/predator-analytics"
REMOTE_DIST="$REMOTE_BASE/apps/predator-analytics-ui/dist"
LOCAL_DIST="/Users/dima-mac/Documents/Predator_21/apps/predator-analytics-ui/dist"
LOCAL_PROJECT="/Users/dima-mac/Documents/Predator_21/apps/predator-analytics-ui"

# Перехід в директорію проекту
cd "$LOCAL_PROJECT"

echo "🛠️ ПІДГОТОВКА ДО РОЗГОРТАННЯ V45 (DOCKER MODE)..."

# 1. Перевірка доступності сервера
if ! ssh -q -o ConnectTimeout=5 "$SERVER" exit; then
    echo "⚠️ СЕРВЕР НЕДОСТУПНИЙ ($SERVER). Перевірте VPN або SSH конфіг."
    exit 1
fi

echo "✅ Сервер онлайн. Починаємо збірку в Docker..."

# 2. Збірка в Docker контейнері (Node 20)
# Використовуємо тимчасовий контейнер, монтуємо папку проекту
# Виконуємо npm install та npm run build
echo "📦 Запуск Docker контейнера для компіляції..."
docker run --rm \
    -v "$LOCAL_PROJECT":/app \
    -w /app \
    node:20-alpine \
    sh -c "echo 'Installing dependencies...'; npm install --silent --no-progress && echo 'Building project...'; npm run build"

if [ $? -ne 0 ]; then
    echo "❌ Помилка збірки! Перевірте логи вище."
    exit 1
fi

echo "✅ Збірка успішна!"

# 3. Очистка та завантаження на сервер
echo "📤 Передача файлів на сервер ($SERVER)..."
ssh "$SERVER" "mkdir -p $REMOTE_DIST"
rsync -avz --delete "$LOCAL_DIST/" "$SERVER:$REMOTE_DIST/"

# 4. Перевірка Nginx конфігу
echo "⚙️ Синхронізація конфігурації Nginx..."
if [ -f "/Users/dima-mac/Documents/Predator_21/nginx.simple.conf" ]; then
    scp "/Users/dima-mac/Documents/Predator_21/nginx.simple.conf" "$SERVER:$REMOTE_BASE/docker/nginx.simple.conf"
fi

# 5. Перезапуск веб-сервера
echo "🔄 Перезапуск фронтенд-сервера..."
ssh "$SERVER" "docker kill predator-fixed-frontend 2>/dev/null; docker rm predator-fixed-frontend 2>/dev/null"
ssh "$SERVER" "docker run -d --name predator-fixed-frontend \
    --restart unless-stopped \
    -p 8080:80 \
    -v $REMOTE_DIST:/usr/share/nginx/html:ro \
    -v $REMOTE_BASE/docker/nginx.simple.conf:/etc/nginx/nginx.conf:ro \
    nginx:alpine"

echo "🎉 УСПІХ! Оновлення розгорнуто."
echo "🔗 Інтерфейс: https://jolyn-bifid-eligibly.ngrok-free.dev/admin"
echo "🔗 Парсери: https://jolyn-bifid-eligibly.ngrok-free.dev/parsers"
