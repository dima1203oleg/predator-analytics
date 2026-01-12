#!/bin/bash
# Predator Analytics System Doctor
# WinSURF-style self-diagnostics

echo "🏥 Predator System Doctor is analyzing the health of Predator Analytics v25.1..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. Container Health
echo -n "🐳 Checking Docker Containers... "
RUNNING_COUNT=$(docker ps --filter "name=predator" --format "{{.Names}}" | wc -l)
if [ "$RUNNING_COUNT" -ge 3 ]; then
    echo "✅ OK ($RUNNING_COUNT containers)"
else
    echo "❌ CRITICAL: Only $RUNNING_COUNT containers running"
    docker ps --filter "name=predator"
fi

# 2. Database Connectivity
echo -n "💾 Checking Database... "
docker exec predator_postgres pg_isready -U dima > /dev/null 2>&1
if [ $? -eq 0 ]; then echo "✅ OK"; else echo "❌ FAILED"; fi

# 3. Redis Connectivity
echo -n "🧠 Checking Cache (Redis)... "
docker exec predator_redis redis-cli ping | grep PONG > /dev/null 2>&1
if [ $? -eq 0 ]; then echo "✅ OK"; else echo "❌ FAILED"; fi

# 4. LLM API Connectivity (Bot side)
echo -n "🤖 Checking LLM Connectivity (Agent mode)... "
docker exec predator_telegram_bot python3 -c "import os; print('✅ Key Set' if os.getenv('GEMINI_API_KEY') else '❌ Key Missing')"

# 5. Core Test Suite
echo "🧪 Running Core Governance Tests..."
docker exec predator_telegram_bot python3 libs/core/tests/test_governance.py > /dev/null 2>&1
if [ $? -eq 0 ]; then echo "✅ Governance Logic: PASSED"; else echo "❌ Governance Logic: FAILED"; fi

# 6. Environment Check
echo -n "🌍 Execution Stage: "
STAGE=$(docker exec predator_telegram_bot python3 -c "from bot.config import settings; print(settings.ENVIRONMENT)")
echo "$STAGE"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Analysis Complete."
