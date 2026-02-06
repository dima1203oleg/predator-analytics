#!/bin/bash
cd ~/predator-analytics
if [ -d ".venv_bot" ]; then
    source .venv_bot/bin/activate
fi
set -a
[ -f .env ] && source .env
set +a
echo "🚀 Starting Telegeram Bot Production..."
nohup python backend/orchestrator/agents/telegram_bot_production.py > bot.log 2>&1 &
echo "✅ Bot started with PID: $!"
