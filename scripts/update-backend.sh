#!/bin/bash
# Update Backend on the NVIDIA Server

SERVER="dima@194.177.1.240"
PORT="6666"
REMOTE_ROOT="/home/dima/predator-analytics"

echo "🚀 Синхронізація Backend коду..."
rsync -avz -e "ssh -p $PORT" --exclude '__pycache__' services/api-gateway/ $SERVER:$REMOTE_ROOT/services/api-gateway/
rsync -avz -e "ssh -p $PORT" --exclude '__pycache__' libs/ $SERVER:$REMOTE_ROOT/libs/

echo "🏗️ Перезбірка Backend через Docker Compose..."
ssh -p $PORT $SERVER "cd $REMOTE_ROOT && docker compose build backend && docker compose up -d backend"

echo "✅ Backend оновлено!"
