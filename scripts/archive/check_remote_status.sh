#!/bin/bash
# Швидка перевірка статусу Docker на сервері

HOST="194.177.1.240"
PORT="6666"
USER="dima"

echo "📡 Connecting to remote server ($HOST:$PORT)..."
ssh -p $PORT -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=10 $USER@$HOST "docker ps --format 'table {{.Names}}\t{{.Status}}'" || echo "❌ SSH Connection Failed"
