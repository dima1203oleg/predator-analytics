#!/bin/bash
# 🦁 PREDATOR V30 - Простий Запуск (обхід EPERM)

echo "🦁 PREDATOR V30 - Швидкий Запуск"
echo "================================"

# Очистити порти
echo "🧹 Очищення портів..."
lsof -ti :3030 | xargs kill -9 2>/dev/null || true
lsof -ti :9080 | xargs kill -9 2>/dev/null || true

# Перейти в UI директорію
cd /Users/dima-mac/Documents/Predator_21/apps/predator-analytics-ui

# Встановити змінні середовища
export VITE_BACKEND_PROXY_TARGET="http://localhost:9080"
export VITE_API_URL="/api/v1"

echo "🚀 Запуск UI на порту 3030..."
echo "📡 Backend: http://localhost:9080"
echo "🌐 Frontend: http://localhost:3030"
echo ""

# Спробувати різні способи запуску
if command -v pnpm &> /dev/null; then
    echo "✅ Використовую pnpm..."
    pnpm dev --port 3030 --host
elif [ -f "node_modules/.bin/vite" ]; then
    echo "✅ Використовую локальний vite..."
    ./node_modules/.bin/vite --port 3030 --host
else
    echo "⚠️  Спроба через npx..."
    npx vite --port 3030 --host
fi
