#!/bin/bash
cd ~/predator-analytics
if [ -d ".venv_bot" ]; then
    source .venv_bot/bin/activate
fi
set -a
[ -f .env ] && source .env
set +a
echo "🚀 Starting Autonomous Orchestrator (God Mode)..."
nohup python backend/orchestrator/main.py > orchestrator.log 2>&1 &
echo "✅ Orchestrator started with PID: $!"
