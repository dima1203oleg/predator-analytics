#!/bin/bash
# 🦁 PREDATOR BACKEND FINAL FIX & LAUNCH
# Цей скрипт призначений для "жвавого" старту бекенду, щоб розблокувати UI

echo "🦁 PREDATOR V45: FINAL BACKEND LAUNCH SEQUENCE"
echo "==============================================="

# 1. Kill old processes
echo "🔪 Killing old backend processes..."
pkill -f "uvicorn" || true
pkill -f "python3 -m app.main" || true

# 2. Setup Environment
export PROJECT_ROOT="/Users/dima-mac/Documents/Predator_21"
cd "$PROJECT_ROOT"

# Config Overrides for Resiliency
export LOG_LEVEL="INFO"
export ENVIRONMENT="development"
export HAS_STRUCTLOG="false" # Force fallback logger
export HAS_OTEL="false"      # Force disable OpenTelemetry
export MAX_UPLOAD_SIZE="1073741824" # 1GB

# 3. Check venv
if [ ! -d ".venv" ]; then
    echo "⚠️ .venv not found. Creating..."
    python3 -m venv .venv
fi

source .venv/bin/activate

# 4. Emergency Install (No SSL Verify to bypass proxy/cert issues)
echo "📦 Installing critical dependencies (Safe Mode)..."
pip install --trusted-host pypi.org --trusted-host pypi.python.org --trusted-host files.pythonhosted.org \
    fastapi uvicorn sqlalchemy asyncpg pydantic-settings python-multipart \
    requests aiofiles python-dotenv redis

# Try to install structlog but don't fail if it breaks
pip install structlog --trusted-host pypi.org --trusted-host files.pythonhosted.org || echo "⚠️ structlog install failed, using fallback"

# 5. Launch
echo "🚀 Launching UVICORN..."
# We run in background but capture PID
nohup python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > backend_debug.log 2>&1 &
BACKEND_PID=$!

echo "✅ Backend started with PID: $BACKEND_PID"
echo "📜 Logs are being written to $PROJECT_ROOT/backend_debug.log"
echo ""
echo "⏳ Waiting for health check..."

# 6. Health Check Loop
for i in {1..15}; do
    if curl -s http://localhost:8000/api/v1/health > /dev/null; then
        echo "🟢 BACKEND IS ONLINE! (Attempt $i)"
        echo "   URL: http://localhost:8000"
        echo "   Docs: http://localhost:8000/docs"
        exit 0
    fi
    sleep 2
    echo -n "."
done

echo ""
echo "⚠️ Backend did not respond in 30 seconds. Check backend_debug.log"
tail -n 20 backend_debug.log
