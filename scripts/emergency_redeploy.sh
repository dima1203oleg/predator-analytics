#!/bin/bash
SERVER="predator-server"
DOMAIN="jolyn-bifid-eligibly.ngrok-free.dev"

echo "🚨 EMERGENCY REDEPLOY PROTOCOL INITIATED..."

# 1. Cleaning Disk Space (Docker Prune) - Forcefully
echo "🧹 Pruning Docker System to free up space..."
ssh -o ConnectTimeout=10 "$SERVER" "docker system prune -a -f --volumes"

# 2. Kill everything related to web
echo "☠️ Killing old web services..."
ssh -o ConnectTimeout=10 "$SERVER" "docker kill predator-fixed-frontend ngrok 2>/dev/null; docker rm predator-fixed-frontend 2>/dev/null"

# 3. Start Frontend (Assuming dist already exists from previous attempt, if not - build it lightly)
# We will use the existing dist if possible to save time/space.
REMOTE_UI="/home/dima/predator-analytics/apps/predator-analytics-ui"
NGINX_CONF="/home/dima/predator-analytics/docker/nginx.simple.conf"

echo "🚀 Starting Frontend Container..."
ssh -o ConnectTimeout=10 "$SERVER" "docker run -d --name predator-fixed-frontend \
    --restart always \
    -p 8080:80 \
    -v $REMOTE_UI/dist:/usr/share/nginx/html:ro \
    -v $NGINX_CONF:/etc/nginx/nginx.conf:ro \
    nginx:alpine"

# 4. Restart Ngrok
echo "🔗 Restarting Ngrok Tunnel..."
ssh -o ConnectTimeout=10 "$SERVER" "nohup ngrok http --domain=$DOMAIN 8080 > /home/dima/ngrok.log 2>&1 &"

echo "✅ DONE. Check https://$DOMAIN in 10 seconds."
