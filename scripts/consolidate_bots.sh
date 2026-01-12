#!/bin/bash
set -e

# Configuration
HOST="194.177.1.240"
PORT="6666"
USER="dima"
REMOTE_PATH="/home/dima/Predator_21/backend/orchestrator"

echo "🧹 Cleaning up old bots and deploying The One Bot V4.0..."

# 1. Upload unified bot file
echo "📤 Uploading unified bot..."
scp -P $PORT backend/orchestrator/agents/telegram_bot_v4_advanced.py \
    $USER@$HOST:$REMOTE_PATH/agents/telegram_bot.py

# 2. Upload extensions integration
echo "📤 Uploading extensions integration..."
scp -P $PORT backend/orchestrator/agents/telegram_bot_extensions_integration.py \
    $USER@$HOST:$REMOTE_PATH/agents/

# 3. Clean up and restart
echo "🔄 Cleaning and restarting..."
ssh -p $PORT $USER@$HOST << 'ENDSSH'
cd /home/dima/Predator_21/backend/orchestrator
source venv/bin/activate

# Kill all bots
echo "🛑 Stopping all bots..."
pkill -f telegram_bot || true
pkill -f telegram_bot_production.py || true
pkill -f telegram_bot_v2.py || true
pkill -f telegram_bot_v3.py || true
pkill -f telegram_bot_v4_advanced.py || true

# Remove old files (backup first if needed, but user said remove garbage)
echo "🗑️ Removing old bot files..."
rm -f agents/telegram_bot_v*.py
rm -f agents/telegram_bot_production.py
rm -f agents/telegram_bot_production_backup_*.py

# Start The One Bot
echo "🚀 Starting The One Bot..."
export REDIS_URL="redis://localhost:6379/1"
nohup python agents/telegram_bot.py > telegram_bot.log 2>&1 &

sleep 2
if pgrep -f "agents/telegram_bot.py" > /dev/null; then
    echo "✅ Bot started successfully!"
    tail -n 10 telegram_bot.log
else
    echo "❌ Bot failed to start"
    tail -n 20 telegram_bot.log
fi
ENDSSH

echo "✨ Consolidate Complete!"
