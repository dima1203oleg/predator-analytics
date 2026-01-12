#!/bin/bash
# Sync Frontend and Rebuild on NVIDIA Server

SERVER="predator-server"
# Credentials and port are handled by ~/.ssh/config

echo "🚀 Синхронізація файлів фронтенду (без node_modules)..."
rsync -avz --exclude 'node_modules' --exclude 'dist' apps/frontend/ $SERVER:~/predator-analytics/apps/frontend/

echo "🏗️ Перезбірка фронтенду на сервері..."
# Executing remote command
ssh $SERVER "cd ~/predator-analytics && docker compose build frontend && docker compose up -d frontend"

echo "✅ Фронтенд оновлено!"
