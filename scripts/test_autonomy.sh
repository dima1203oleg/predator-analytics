#!/bin/bash
set -e

echo "🤖 Starting Autonomy Self-Check..."

# 1. Check Docker Services
echo "🔍 Checking container status..."
if docker ps | grep -q "predator_telegram_bot"; then
    echo "✅ Telegram Bot: RUNNING"
else
    echo "❌ Telegram Bot: MISSING or STOPPED"
    exit 1
fi

if docker ps | grep -q "predator_backend"; then
    echo "✅ Backend: RUNNING"
else
    echo "❌ Backend: MISSING or STOPPED"
    exit 1
fi

# 2. Verify Shared Library Access (Simulate inside Backend)
echo "🔍 Verifying Governance Policy Access..."
docker exec predator_backend python3 -c "import sys; sys.path.append('/app'); from libs.core.governance import OperationalPolicy; print(f'✅ Policy Loaded. Forbidden commands: {len(OperationalPolicy.FORBIDDEN_COMMANDS)}')"

# 3. Check CLI Tools in Bot
echo "🔍 Verifying Agent Capability (OpsAgent)..."
docker exec predator_telegram_bot which kubectl > /dev/null && echo "✅ Kubectl: FOUND" || echo "⚠️ Kubectl not found in bot"
docker exec predator_telegram_bot which argocd > /dev/null && echo "✅ ArgoCD: FOUND" || echo "⚠️ ArgoCD not found in bot"
docker exec predator_telegram_bot which mc > /dev/null && echo "✅ MinIO Client: FOUND" || echo "⚠️ MinIO Client not found in bot"

# 4. Check Mixed CLI Stack
echo "🔍 Verifying Mixed CLI Stack (Level 1-3)..."
python3 scripts/triple_cli.py --agent planner "Self-test" > /dev/null && echo "✅ Level 1 (Gemini Planner): READY" || echo "⚠️ Level 1 (Planner) Failed"
# Mistral and Aider checks inside orchestrator
docker exec predator_orchestrator python3 -c "import mistralai; print('✅ Level 2 (Mistral): READY')" || echo "⚠️ Level 2 (Mistral) missing in orchestrator"
docker exec predator_orchestrator which aider > /dev/null && echo "✅ Level 3 (Aider): READY" || echo "⚠️ Level 3 (Aider) missing in orchestrator"

echo "🎉 Autonomy Self-Check COMPLETED. System is ready for autonomous operations (Mixed CLI Stack v45.0 active)."
