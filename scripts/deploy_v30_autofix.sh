#!/bin/bash
set -e

# Configuration
SERVER_IP="194.177.1.240"
SSH_PORT="6666"
SSH_USER="dima"
REMOTE_BASE="/home/dima/predator-analytics"
REMOTE_DIST="$REMOTE_BASE/apps/predator-analytics-ui/dist"
LOCAL_DIST="/Users/dima-mac/Documents/Predator_21/apps/predator-analytics-ui/dist"
LOCAL_PROJECT="/Users/dima-mac/Documents/Predator_21/apps/predator-analytics-ui"
FIX_SCRIPT="/Users/dima-mac/Documents/Predator_21/scripts/FIX_ALL_PERMISSIONS.sh"

echo "🔧 AUTO-FIX & DEPLOY: Predator V30.0.0"
echo "========================================"

# 1. Запуск фіксу прав (якщо файл існує)
if [ -f "$FIX_SCRIPT" ]; then
    echo "🛠️  Running permission fix..."
    # We call it without sudo inside script if possible, or user runs this whole script.
    # But usually FIX_ALL_PERMISSIONS requires interactive sudo.
    echo "   (Skipping auto-run of sudo script to avoid blocking. Run 'FIX_ALL_PERMISSIONS.sh' manually if needed)"
else
    echo "⚠️  Fix script not found."
fi

# 2. Build
echo "🏗️  Building Frontend (V30)..."
cd "$LOCAL_PROJECT"
npm run build

# 3. Deploy
echo "🚀 Deploying to NVIDIA Server..."

# Try rsync with specific ssh options to avoid some permission/key errors
rsync -avz -e "ssh -p $SSH_PORT -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null" --delete "$LOCAL_DIST/" "$SSH_USER@$SERVER_IP:$REMOTE_DIST/"

# 4. Restart Nginx
echo "🔄 Restarting Remote Server..."
ssh -p $SSH_PORT -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "$SSH_USER@$SERVER_IP" "docker restart predator-fixed-frontend || docker run -d --name predator-fixed-frontend -p 8080:80 -v $REMOTE_DIST:/usr/share/nginx/html:ro nginx:alpine"

echo "✅ DONE! V30 Deployment Complete."
echo "👉 Local: http://localhost:3030"
echo "👉 Server: http://$SERVER_IP:8080"
