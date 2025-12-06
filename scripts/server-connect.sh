#!/bin/bash

# Швидке підключення до сервера Predator Analytics
# Використання: ./scripts/server-connect.sh [command]

SSH_KEY="$HOME/.ssh/id_ed25519_ngrok"
SSH_HOST="5.tcp.eu.ngrok.io"
SSH_PORT="14564"
SSH_USER="dima"
REMOTE_DIR="predator-analytics"

echo "🚀 Підключення до сервера Predator Analytics..."
echo "📍 Хост: $SSH_HOST:$SSH_PORT"
echo "👤 Користувач: $SSH_USER"
echo ""

# Якщо передано команду - виконати її на сервері
if [ -n "$1" ]; then
    echo "🔧 Виконую команду: $@"
    ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd ~/$REMOTE_DIR && $@"
else
    # Інтерактивне підключення
    echo "🔗 Інтерактивне підключення..."
    ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST"
fi
