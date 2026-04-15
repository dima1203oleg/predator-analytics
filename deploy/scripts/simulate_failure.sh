#!/bin/bash
# PREDATOR v56.4.5 | Симулятор Збою для Тестування Watchdog (HR-03)

echo "⚠️  ЗАПУСК СИМУЛЯЦІЇ КРИТИЧНОГО ЗБОЮ..."
echo "🛑 Зупинка основних сервісів Core-API..."

# Знаходимо PID процесу FastAPI (uvicorn) та вбиваємо його
PID=$(pgrep -f "uvicorn app.main:app")
if [ -z "$PID" ]; then
    echo "❌ Процес Core-API не знайдено."
else
    kill -9 $PID
    echo "✅ Core-API зупинено (PID: $PID)."
fi

echo "🛡️  Очікування реакції Sovereign Guardian (Watchdog)..."
echo "ℹ️  Перевірте логи: tail -f services/core-api/logs/guardian.log"
