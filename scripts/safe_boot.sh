#!/bin/bash
# 🛡️ PREDATOR SAFE BOOT PROTOCOL
# ==============================
# Запуск системи в захищеному режимі (Disaster Recovery).
# - Вимкнено автономні агенти
# - Вимкнено зовнішній доступ (тільки localhost)
# - Read-Only режим для баз даних (опціонально)

echo "🛡️  INITIATING SAFE BOOT SEQUENCE..."

# 1. Створення Kill Switch (блокує автономність)
touch .safety_lock
echo "🔒 Autonomy Kill Switch ENGAGED (.safety_lock created)"

# 2. Зупинка всіх контейнерів
echo "🛑 Stopping running services..."
docker compose down --remove-orphans

# 3. Запуск тільки критичної інфраструктури (Без AI)
echo "🏗️  Starting CRITICAL INFRASTRUCTURE only (DBs + Core)..."
docker compose up -d postgres redis constitutional-core backend frontend

# 4. Перевірка здоров'я
echo "🏥 Checking system health..."
sleep 10
if curl -s http://localhost:8090/health > /dev/null; then
    echo "✅ Backend is ALIVE (Safe Mode)"
else
    echo "⚠️  Backend check FAILED"
fi

echo "=================================================="
echo "🛡️  SAFE MODE ACTIVE. AI AGENTS ARE DISABLED."
echo "   Access UI at: http://localhost:8080"
echo "   To restore normal operation: rm .safety_lock && ./scripts/start.sh"
echo "=================================================="
