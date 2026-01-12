#!/bin/bash
# 🚀 Telegram Bot V4.0 - Deploy to Server Script

set -e

echo "🚀 Deploying Telegram Bot V4.0 to NVIDIA Server..."
echo "=================================================="

# Configuration
SERVER_USER="dima"
SERVER_HOST="194.177.1.240"
SERVER_PATH="/home/dima/Predator_21"
BOT_PATH="backend/orchestrator/agents"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo ""
echo -e "${YELLOW}Step 1: Backing up current version...${NC}"
ssh ${SERVER_USER}@${SERVER_HOST} << 'ENDSSH'
cd /home/dima/Predator_21/backend/orchestrator/agents
if [ -f telegram_bot_production.py ]; then
    cp telegram_bot_production.py telegram_bot_production_backup_$(date +%Y%m%d_%H%M%S).py
    echo "✅ Backup created"
else
    echo "⚠️  No existing production version found"
fi
ENDSSH

echo ""
echo -e "${YELLOW}Step 2: Uploading new files...${NC}"

# Upload main bot
echo "📤 Uploading telegram_bot_v4_advanced.py..."
scp backend/orchestrator/agents/telegram_bot_v4_advanced.py \
    ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/${BOT_PATH}/

# Upload extensions
echo "📤 Uploading telegram_bot_extensions.py..."
scp backend/orchestrator/agents/telegram_bot_extensions.py \
    ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/${BOT_PATH}/

echo "📤 Uploading telegram_bot_extensions_integration.py..."
scp backend/orchestrator/agents/telegram_bot_extensions_integration.py \
    ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/${BOT_PATH}/

# Upload requirements
echo "📤 Uploading requirements..."
scp backend/orchestrator/requirements_telegram_v4.txt \
    ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/backend/orchestrator/

echo ""
echo -e "${YELLOW}Step 3: Installing dependencies...${NC}"
ssh ${SERVER_USER}@${SERVER_HOST} << 'ENDSSH'
cd /home/dima/Predator_21/backend/orchestrator

# Activate venv or create if not exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate

echo "📦 Installing dependencies..."
pip install -q --upgrade pip
pip install -q -r requirements_telegram_v4.txt

echo "✅ Dependencies installed"
deactivate
ENDSSH

echo ""
echo -e "${YELLOW}Step 4: Checking Redis...${NC}"
ssh ${SERVER_USER}@${SERVER_HOST} << 'ENDSSH'
if systemctl is-active --quiet redis; then
    echo "✅ Redis is running"
elif docker ps | grep -q redis; then
    echo "✅ Redis is running (Docker)"
else
    echo "⚠️  Redis not running - starting..."
    if command -v redis-server &> /dev/null; then
        sudo systemctl start redis
        echo "✅ Redis started"
    elif command -v docker &> /dev/null; then
        docker run -d --name redis -p 6379:6379 redis:alpine
        echo "✅ Redis started (Docker)"
    else
        echo "❌ Redis not available - bot will use memory storage"
    fi
fi
ENDSSH

echo ""
echo -e "${YELLOW}Step 5: Stopping old bot...${NC}"
ssh ${SERVER_USER}@${SERVER_HOST} << 'ENDSSH'
# Find and stop old bot process
BOT_PID=$(ps aux | grep telegram_bot | grep -v grep | awk '{print $2}')
if [ ! -z "$BOT_PID" ]; then
    echo "🛑 Stopping old bot (PID: $BOT_PID)..."
    kill $BOT_PID
    sleep 2
    echo "✅ Old bot stopped"
else
    echo "ℹ️  No running bot found"
fi
ENDSSH

echo ""
echo -e "${YELLOW}Step 6: Starting new bot...${NC}"
ssh ${SERVER_USER}@${SERVER_HOST} << 'ENDSSH'
cd /home/dima/Predator_21/backend/orchestrator

# Activate venv
source venv/bin/activate

# Start bot in background
nohup python agents/telegram_bot_v4_advanced.py > telegram_bot_v4.log 2>&1 &
BOT_PID=$!

echo "✅ Bot started (PID: $BOT_PID)"
echo "📝 Logs: tail -f telegram_bot_v4.log"

# Wait a bit and check if it's still running
sleep 3
if ps -p $BOT_PID > /dev/null; then
    echo "✅ Bot is running successfully!"
else
    echo "❌ Bot failed to start - check logs"
    tail -n 20 telegram_bot_v4.log
    exit 1
fi

deactivate
ENDSSH

echo ""
echo -e "${GREEN}=================================================="
echo "✅ Deployment completed successfully!"
echo "=================================================="
echo ""
echo "📊 Next steps:"
echo "  1. Check logs: ssh ${SERVER_USER}@${SERVER_HOST} 'tail -f /home/dima/Predator_21/backend/orchestrator/telegram_bot_v4.log'"
echo "  2. Test bot in Telegram"
echo "  3. Monitor for 24 hours"
echo ""
echo "🔄 Rollback if needed:"
echo "  ssh ${SERVER_USER}@${SERVER_HOST}"
echo "  cd /home/dima/Predator_21/backend/orchestrator/agents"
echo "  cp telegram_bot_production_backup_*.py telegram_bot_production.py"
echo ""
