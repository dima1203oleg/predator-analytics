#!/bin/bash

# 🤖 Запуск автономного тестування в CI режимі
# Швидке тестування безheaded mode

set -e

echo "🤖 Запуск автономного тестування (CI режим)..."
cd /Users/Shared/Predator_60/apps/predator-analytics-ui

# Швидкий запуск тестів
npx playwright test autonomous-surface-tester.spec.ts --project=autonomous-surface --reporter=list --reporter=json

# Перевіряємо статус
if [ $? -eq 0 ]; then
  echo "✅ Автономне тестування успішне"
  
  # Автономний коміт
  ./scripts/auto-commit.sh
  
  exit 0
else
  echo "❌ Автономне тестування не вдалося"
  exit 1
fi
