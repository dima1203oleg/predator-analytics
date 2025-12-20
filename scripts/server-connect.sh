#!/bin/bash

# Швидке підключення до сервера Predator Analytics
# Використання: ./scripts/server-connect.sh [command]

# === КОНФІГУРАЦІЯ ===
SSH_HOST="194.177.1.240"
SSH_PORT="6666"
SSH_USER="dima"
REMOTE_DIR="predator-analytics"

# Спочатку пробуємо SSH ключ, якщо не працює - пароль
SSH_KEY="$HOME/.ssh/id_ed25519_ngrok"

echo "🚀 Підключення до сервера Predator Analytics..."
echo "📍 Хост: $SSH_HOST:$SSH_PORT"
echo "👤 Користувач: $SSH_USER"
echo ""

# Порти для пробросу (Local Forwarding)
# 59997: Google OAuth, 8092: Frontend, 8090: Backend, 5601: Dashboards, 3001: Grafana, 15672: RabbitMQ
FORWARDS="-L 59997:localhost:59997 -L 8092:localhost:8092 -L 8090:localhost:8090 -L 5601:localhost:5601 -L 3001:localhost:3001 -L 15672:localhost:15672"

# Перевірка SSH ключа
SSH_CMD="ssh -p $SSH_PORT $FORWARDS"
if [ -f "$SSH_KEY" ]; then
    SSH_CMD="$SSH_CMD -i $SSH_KEY -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null"
fi

# Якщо передано команду - виконати її на сервері
if [ -n "$1" ]; then
    echo "🔧 Виконую команду: $@"
    $SSH_CMD "$SSH_USER@$SSH_HOST" "cd ~/$REMOTE_DIR && $@"
else
    # Інтерактивне підключення
    echo "🔗 Інтерактивне підключення..."
    $SSH_CMD "$SSH_USER@$SSH_HOST"
fi
