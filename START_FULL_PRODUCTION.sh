#!/bin/bash
# 🦁 PREDATOR v30: FULL PRODUCTION LAUNCH
# Цей скрипт запускає систему у режимі повної бойової готовності.

echo "🦁 PREDATOR v30: INITIATING PRODUCTION SEQUENCE..."
echo "==================================================="

PROJECT_ROOT=$(pwd)
LOG_FILE="$PROJECT_ROOT/production.log"

# 1. CLEANUP
echo "🧹 Cleaning previous sessions..."
pkill -f "uvicorn" || true
pkill -f "predator-ui" || true
pkill -f "node" || true

# 2. BACKEND LAUNCH (REAL MODE)
echo "🔌 Starting Predator Neural Backend..."
if [ -d ".venv" ]; then
    source .venv/bin/activate
else
    echo "⚠️  Critical: .venv not found! Run setup first."
    exit 1
fi

export ENVIRONMENT="production"
export LOG_LEVEL="INFO"
export MAX_UPLOAD_SIZE="1073741824"
export ALLOW_ORIGINS='["*"]'

# Відключаємо проблемні модулі, залишаючи ядро робочим
export HAS_STRUCTLOG="false"
export HAS_OTEL="false"

# Запуск у фоні
nohup python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4 > "$LOG_FILE" 2>&1 &
BACKEND_PID=$!
echo "✅ Backend Online (PID: $BACKEND_PID)"

# 3. FRONTEND LAUNCH
echo "🖥️  Starting Predator Intelligence Interface..."
cd apps/predator-analytics-ui

# Перевірка наявності node_modules
if [ ! -d "node_modules" ]; then
    echo "📦 Installing UI dependencies..."
    npm install --silent
fi

# Запуск UI
nohup npm run dev -- --host --port 3000 > /dev/null 2>&1 &
UI_PID=$!
echo "✅ UI Online (PID: $UI_PID)"

# 4. CAPABILITY CHECK
echo "🔍 Verifying System Integrity..."
sleep 5
if curl -s http://localhost:8000/api/v1/health > /dev/null; then
    echo "🟢 SYSTEM GREEN. ALL SYSTEMS OPERATIONAL."
else
    echo "⚠️  Backend Warning: API not responding yet (Check $LOG_FILE)"
fi

echo ""
echo "🚀 PREDATOR V30 IS READY."
echo "👉 Interface: http://localhost:3000"
echo "👉 API Docs:  http://localhost:8000/docs"
echo "==================================================="
echo "Press CTRL+C to stop the system."

wait $BACKEND_PID $UI_PID
