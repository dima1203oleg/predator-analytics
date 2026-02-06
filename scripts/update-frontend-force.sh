#!/bin/bash
# PREDATOR v30 Frontend Update Script (Force Rebuild)

set -e

SERVER="predator-server"
# Credentials and port are handled by ~/.ssh/config

echo "🚀 Синхронізація файлів фронтенду v30 (без node_modules)..."
rsync -avz --exclude 'node_modules' --exclude 'dist' apps/predator-analytics-ui/ $SERVER:~/predator-analytics/apps/frontend/

echo "🏗️ Перезбірка фронтенду на сервері (БЕЗ КЕШУ)..."
# Executing remote command
ssh $SERVER << 'ENDSSH'
cd ~/predator-analytics
docker compose build --no-cache frontend
docker compose up -d frontend
ENDSSH

echo "✅ Фронтенд оновлено до v30 (чиста збірка)!"
