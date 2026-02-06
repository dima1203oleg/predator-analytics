#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# 🩹 PREDATOR V30 - HOTFIX DEPLOYMENT
# Fixes Context API crashes and ensures stability
# ═══════════════════════════════════════════════════════════════

SERVER="predator-server"
SOURCE_DIR="apps/predator-analytics-ui/src"
REMOTE_DIR="~/predator-analytics/apps/predator-analytics-ui/src"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🩹 DEPLOYING V30 HOTFIXES (FULL SOURCE)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. Sync ALL modified source files (api.ts, sidebar, contexts)
echo "📤 Syncing source code..."
rsync -avz --progress --exclude 'node_modules' $SOURCE_DIR/ $SERVER:$REMOTE_DIR/

# 2. Sync index.html just in case
echo "📤 Syncing index.html..."
rsync -avz apps/predator-analytics-ui/index.html $SERVER:~/predator-analytics/apps/predator-analytics-ui/

echo "✅ Files uploaded."
echo ""

# 3. Rebuild and Restart on Server
echo "🔄 Rebuilding Frontend on Server..."
ssh $SERVER << 'ENDSSH'
cd ~/predator-analytics

# Stop and remove old
docker compose down frontend
docker rm -f predator_frontend

# Rebuild without cache to ensure new code is used
echo "🏗️ Building new image..."
docker compose build --no-cache frontend

# Start new container
echo "🚀 Starting container..."
docker compose up -d frontend

# Verify
echo "🔍 Checking status:"
docker compose ps frontend
ENDSSH

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ HOTFIX DEPLOYED!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📍 Access: http://localhost:9080"
echo "⚠️  PLEASE HARD RELOAD (Cmd+Shift+R)!"
echo ""
