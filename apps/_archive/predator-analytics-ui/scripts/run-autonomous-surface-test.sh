#!/bin/bash

# 🤖 Запуск автономного тестування поверхні (Google Antigravity Style)
# Автоматично тестиує веб інтерфейс без участі людини

set -e

echo "🤖 Запуск автономного тестування поверхні..."
echo "🎯 Стиль: Google Antigravity - симуляція реального користувача"

# Переходимо в директорію UI
cd /Users/Shared/Predator_60/apps/predator-analytics-ui

# Запускаємо автономний dev server якщо не запущений
if ! curl -s http://localhost:3030 > /dev/null 2>&1; then
  echo "🚀 Запуск автономного dev server..."
  export VITE_ENABLE_MOCK_API="true"
  npm run dev &
  DEV_PID=$!
  echo "PID: $DEV_PID"
  
  # Чекаємо готовності сервера
  for i in {1..30}; do
    if curl -s http://localhost:3030 > /dev/null 2>&1; then
      echo "✅ Сервер готовий"
      break
    fi
    echo "⏳ Чекаємо сервер... ($i/30)"
    sleep 2
  done
fi

# Запускаємо автономне тестування
echo "🧪 Запуск Playwright тестів..."
npx playwright test autonomous-surface-tester.spec.ts --project=autonomous-surface --headed=false

# Перевіряємо результат
if [ $? -eq 0 ]; then
  echo "✅ Автономне тестування пройшло успішно"
  
  # Генеруємо звіт
  echo "📊 Генерація звіту..."
  npx playwright show-report
  
  # Автономний коміт результатів
  echo "💾 Автономний коміт результатів..."
  ./scripts/auto-commit.sh
  
  echo "🎉 Тестування завершено успішно"
else
  echo "❌ Автономне тестування не вдалося"
  echo "📊 Перевірте звіт: playwright-report/"
  exit 1
fi

# Зупиняємо dev server якщо запускали його
if [ ! -z "$DEV_PID" ]; then
  echo "🛑 Зупинення dev server (PID: $DEV_PID)..."
  kill $DEV_PID 2>/dev/null || true
fi
