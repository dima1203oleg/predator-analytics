#!/bin/bash
SERVER="predator-server"
DOMAIN="jolyn-bifid-eligibly.ngrok-free.dev"

echo "🔨 KILLING NGROK..."
ssh "$SERVER" "pkill -9 ngrok"

echo "🚀 STARTING NGROK (Background Mode -f)..."
# Using -f flag to physically detach SSH client
ssh -f "$SERVER" "nohup ngrok http --domain=$DOMAIN 8080 > /home/dima/ngrok.log 2>&1 < /dev/null &"

echo "✅ Done. Command sent to background. You can close terminal if needed."
