#!/bin/bash
SERVER="predator-server"
SSH_OPTS="-o ControlPath=none"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧹 DEEP CLEAN & DEPLOY V30"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Sync latest source code first
echo "📤 Syncing source code..."
rsync -avz -e "ssh $SSH_OPTS" --exclude 'node_modules' apps/predator-analytics-ui/src/ $SERVER:~/predator-analytics/apps/predator-analytics-ui/src/

ssh $SSH_OPTS $SERVER << 'ENDSSH'
set -e
cd ~/predator-analytics

echo "🔍 Finding running frontends..."
docker ps --format "{{.ID}} {{.Names}} {{.Ports}}" | grep frontend

echo "🛑 KILLING OLD CONTAINERS..."
# Stop main frontend
docker compose down frontend
# Force remove any container with 'frontend' in name
docker ps -a | grep frontend | awk '{print $1}' | xargs -r docker rm -f

echo "🧹 Pruning conflicting networks/volumes..."
docker network prune -f

echo "🔄 Rebuilding V30 Frontend (NO CACHE)..."
# Ensure we map 80:80 explicitly in case compose override exists
export COMPOSER_IGNORE_PLATFORM_REQ=1
docker compose build --no-cache frontend

echo "🚀 Starting V30 Frontend on Port 80..."
docker compose up -d --force-recreate frontend

echo "⏳ Waiting for init..."
sleep 5

echo "📊 Container Status:"
docker compose ps frontend

echo "📜 Last 20 lines of logs (to check for crash):"
docker compose logs --tail=20 frontend
ENDSSH

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ CLEANUP COMPLETE. NOW OPEN:"
echo "👉 http://localhost:9080"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
