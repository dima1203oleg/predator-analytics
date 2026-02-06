#!/bin/bash
SERVER="predator-server"
DOMAIN="jolyn-bifid-eligibly.ngrok-free.dev"

echo "🔍 Checking remote ngrok status..."
ssh $SERVER "ps aux | grep ngrok"

echo "🛑 Stopping existing ngrok..."
ssh $SERVER "pkill -9 ngrok" || true

echo "🚀 Starting ngrok..."
# Using setsid or parenthesis to detach properly
ssh $SERVER "nohup ngrok http --domain=$DOMAIN 8080 > /home/dima/ngrok.log 2>&1 &"

echo "⏳ Waiting for startup..."
sleep 3

echo "📋 Checking execution logs:"
ssh $SERVER "tail -n 20 /home/dima/ngrok.log"

echo "✅ Done. Try accessing the URL."
