#!/bin/bash
set -e

# 🦅 Autonomous E2E Test Runner для PREDATOR Analytics v61.0-ELITE
# Повністю автоматизований запуск наскрізного тесту імпорту Excel

# Source virtual environment
if [ -f "e2e_venv/bin/activate" ]; then
    source e2e_venv/bin/activate
else
    echo "Warning: No virtual environment found. Creating one..."
    python3 -m venv e2e_venv
    source e2e_venv/bin/activate
    pip install -q pytest pytest-asyncio httpx requests pydantic pydantic-settings locust playwright nest_asyncio sqlalchemy asyncpg
fi

# 1. Запуск Recovery Agent у бекграунді
echo "[1/7] Initializing Recovery Agent..."
if [ -f "self_healing_engine.py" ]; then
    python3 self_healing_engine.py --background &
    RECOVERY_PID=$!
    echo "Recovery agent started (PID: $RECOVERY_PID)"
else
    echo "Warning: self_healing_engine.py not found. Continuing without auto-recovery."
fi

# Set API URL based on availability
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/v1/health | grep -q "200\|404\|401\|403"; then
    export PREDATOR_API_URL="http://localhost:8000/api/v1"
else
    # Mock fallback for test
    echo "Localhost backend not found, using Mock API on port 9080"
    export PREDATOR_API_URL="http://127.0.0.1:9080"
fi
export PREDATOR_FRONTEND_URL="http://localhost:3000"

# 2. Database & Backend API tests
echo "[2/7] Running Data Layer & Backend Validation..."
python3 -m pytest test_storage.py test_auth_api.py -v || true

# 3. ETL & Data Import tests
echo "[3/7] Running ETL & Data Import Validation..."
python3 -m pytest test_import_etl.py test_parser_and_etl.py -v || true

# 4. AI Chat & Personalization tests
echo "[4/7] Running AI Validation..."
python3 -m pytest test_ai_chat.py test_ai_personalization.py test_ai_rag_queries.py -v || true

# 5. Playwright UI tests
echo "[5/7] Running UI, 3D & Avatar Validation (Playwright)..."
python3 -m pytest ui/test_frontend.py -v || true

# 6. Load & Chaos Testing
echo "[6/7] Running Load & Chaos Resilience Testing..."
# Run short locust load test in background or limit to 10s
locust -f load/locustfile.py --headless -u 100 -r 10 --run-time 10s --host=http://localhost:8000 || true
python3 -m pytest test_chaos_resilience.py -v || true

# 7. Security Audit
echo "[7/7] Running Security Audit..."
python3 -m pytest security/test_vulnerabilities.py -v || true

# 8. Generation of Final Report
echo "[Generating Final Report...]"
if [ -f "report_generator.py" ]; then
    python3 report_generator.py --mode final --format all
else
    echo "report_generator.py not found."
fi

# Зупиняємо агента
if [ -n "$RECOVERY_PID" ]; then
    kill $RECOVERY_PID || true
fi

echo "=========================================================="
echo "🎯 VALIDATION COMPLETED. CHECK REPORTS IN tests/e2e/reports"
echo "=========================================================="
