#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# 🎯 PREDATOR V45 - ЧИСТИЙ ДЕПЛОЙ (БЕЗ DOCKER CACHE)
# ═══════════════════════════════════════════════════════════════
# Цей скрипт гарантує, що на сервері буде СПРАВЖНІЙ v45
# ═══════════════════════════════════════════════════════════════

set -e

SERVER="predator-server"
SOURCE_DIR="apps/predator-analytics-ui"
TARGET_DIR="~/predator-analytics/apps/frontend"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 PREDATOR V45 - ПОВНИЙ ДЕПЛОЙ"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Перевірка, що ми в правильній директорії
if [ ! -d "$SOURCE_DIR" ]; then
    echo "❌ ПОМИЛКА: Папка $SOURCE_DIR не знайдена!"
    echo "   Запустіть скрипт з кореня проекту Predator_21"
    exit 1
fi

# Крок 1: Синхронізація
echo "📦 Крок 1/4: Синхронізація файлів на сервер..."
rsync -avz \
    --exclude 'node_modules' \
    --exclude 'dist' \
    --exclude '.git' \
    --exclude '.vite' \
    --delete \
    $SOURCE_DIR/ $SERVER:$TARGET_DIR/

echo "✅ Файли синхронізовано"
echo ""

# Крок 2: Очищення Docker кешу
echo "🧹 Крок 2/4: Очищення Docker кешу на сервері..."
ssh $SERVER << 'ENDSSH'
cd ~/predator-analytics
echo "Видалення старих образів..."
docker compose down frontend 2>/dev/null || true
docker rmi predator-analytics-frontend 2>/dev/null || true
ENDSSH

echo "✅ Кеш очищено"
echo ""

# Крок 3: Збірка БЕЗ кешу
echo "🏗️  Крок 3/4: Збірка образу (БЕЗ КЕШУ - може зайняти 2-3 хв)..."
ssh $SERVER << 'ENDSSH'
cd ~/predator-analytics
docker compose build --no-cache --progress=plain frontend
ENDSSH

echo "✅ Образ зібрано"
echo ""

# Крок 4: Запуск
echo "🚀 Крок 4/4: Запуск контейнера..."
ssh $SERVER << 'ENDSSH'
cd ~/predator-analytics
docker compose up -d frontend
echo ""
echo "Перевірка статусу..."
docker compose ps frontend
ENDSSH

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ ДЕПЛОЙ ЗАВЕРШЕНО!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 Перевірте інтерфейс: http://localhost:9080"
echo "⚠️  ВАЖЛИВО: Зробіть Hard Reload у браузері (Cmd+Shift+R)"
echo ""
echo "🔍 Перевірка версії:"
echo "   ssh $SERVER 'docker exec predator_frontend cat /usr/share/nginx/html/index.html | grep title'"
echo ""
