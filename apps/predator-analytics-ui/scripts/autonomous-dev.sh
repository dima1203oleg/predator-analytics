#!/bin/bash

# 🤖 Автономний запуск dev server без залежностей від бекенду

echo "🚀 Запуск автономного dev server..."

# Встановлюємо змінні оточення для пропуску бекенду
export VITE_AUTO_MODE="true"
export VITE_ENABLE_MOCK_API="true"
export VITE_BACKEND_PROXY_TARGET="mock"

# Запускаємо dev server на порт 3030
cd /Users/Shared/Predator_60/apps/predator-analytics-ui

# Очищаємо порт якщо зайнятий
lsof -ti:3030 | xargs kill -9 2>/dev/null || true

# Запускаємо сервер
npm run dev &

echo "✅ Автономний dev server запущено на http://localhost:3030"
echo "🔌 Вимкнено proxy до бекенду (автономний режим)"
echo "⏳ Очікування готовності сервера..."

# Чекаємо поки сервер буде готовий
for i in {1..30}; do
  if curl -s http://localhost:3030 > /dev/null 2>&1; then
    echo "✅ Сервер готовий!"
    exit 0
  fi
  echo "⏳ Чекаємо сервер... ($i/30)"
  sleep 2
done

echo "❌ Сервер не запустився за 60 секунд"
exit 1
