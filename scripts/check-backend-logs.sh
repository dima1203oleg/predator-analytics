#!/bin/bash
SERVER="dima@194.177.1.240"
PORT="6666"
REMOTE_ROOT="/home/dima/predator-analytics"

echo "🔍 Отримання логів Backend..."
ssh -p $PORT $SERVER "cd $REMOTE_ROOT && docker compose logs --tail=200 backend"
