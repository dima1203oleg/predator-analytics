#!/bin/bash
# Predator v45 | Neural Analytics- Ultra Sync & Deploy Script
# Цей скрипт забезпечує автоматичну синхронізацію фронтенду між локальною машиною та сервером.

SERVER="predator-server"
REMOTE_BASE="/home/dima/predator-analytics"
REMOTE_DIST="$REMOTE_BASE/apps/predator-analytics-ui/dist"
LOCAL_DIST="/Users/dima-mac/Documents/Predator_21/apps/predator-analytics-ui/dist"
LOCAL_PROJECT="/Users/dima-mac/Documents/Predator_21/apps/predator-analytics-ui"

echo "🛠️ ПІДГОТОВКА ДО РОЗГОРТАННЯ V45..."

# 1. Перевірка доступності сервера
if ! ssh -q "$SERVER" exit; then
    echo "⚠️ СЕРВЕР НЕДОСТУПНИЙ. Використовуємо локальний режим."
    echo "Запуск локального сервера розробки..."
    cd "$LOCAL_PROJECT" && npm run dev
    exit 0
fi

echo "✅ Сервер онлайн. Починаємо синхронізацію..."

# 2. Збірка локально (щоб не навантажувати сервер зайвими процесами node)
echo "📦 Збірка проекту..."
cd "$LOCAL_PROJECT" && npm run build

# 3. Очистка статних файлів на сервері та завантаження нових
echo "📤 Передача файлів на сервер..."
ssh "$SERVER" "mkdir -p $REMOTE_DIST"
rsync -avz --delete "$LOCAL_DIST/" "$SERVER:$REMOTE_DIST/"

# 4. Перевірка конфігурації Nginx
echo "⚙️ Перевірка конфігурації Nginx..."
# Копіюємо nginx.simple.conf якщо його немає
if [ -f "/Users/dima-mac/Documents/Predator_21/nginx.simple.conf" ]; then
    scp "/Users/dima-mac/Documents/Predator_21/nginx.simple.conf" "$SERVER:$REMOTE_BASE/docker/nginx.simple.conf"
fi

# 5. Перезапуск контейнера для скидання кешу
echo "🔄 Перезапуск контейнера..."
ssh "$SERVER" "docker kill predator-fixed-frontend 2>/dev/null; docker rm predator-fixed-frontend 2>/dev/null"
ssh "$SERVER" "docker run -d --name predator-fixed-frontend \
    -p 8080:80 \
    -v $REMOTE_DIST:/usr/share/nginx/html:ro \
    -v $REMOTE_BASE/docker/nginx.simple.conf:/etc/nginx/nginx.conf:ro \
    nginx:alpine"

echo "🎉 ГОТОВО! V45 розгорнуто на сервері."
echo "🔗 Перевірте: https://jolyn-bifid-eligibly.ngrok-free.dev/admin"
