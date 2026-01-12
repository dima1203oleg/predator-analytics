#!/bin/bash
set -e

SERVER_USER="dima"
SERVER_HOST="194.177.1.240"
SERVER_PATH="/home/dima/Predator_21"
BOT_PATH="backend/orchestrator/agents"

echo "🔧 Fixing Telegram Bot..."

# 1. Upload .env file
echo "📤 Uploading .env file..."
scp .env ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/backend/orchestrator/.env

# 2. Upload modified bot script
echo "📤 Uploading modified bot script..."
scp backend/orchestrator/agents/telegram_bot_v4_advanced.py \
    ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/${BOT_PATH}/

# 3. Restart bot
echo "🔄 Restarting bot..."
ssh ${SERVER_USER}@${SERVER_HOST} << 'ENDSSH'
cd /home/dima/Predator_21/backend/orchestrator

# Activate venv
source venv/bin/activate

# Stop old bot
echo "🛑 Stopping old bot..."
pkill -f telegram_bot_v4_advanced.py || echo "Bot was not running"
sleep 2

# Start new bot
echo "🚀 Starting new bot..."
nohup python agents/telegram_bot_v4_advanced.py > telegram_bot_v4.log 2>&1 &

# Check status
sleep 2
if pgrep -f telegram_bot_v4_advanced.py > /dev/null; then
    echo "✅ Bot started successfully"
    tail -n 10 telegram_bot_v4.log
else
    echo "❌ Bot failed to start"
    tail -n 20 telegram_bot_v4.log
fi
ENDSSH
