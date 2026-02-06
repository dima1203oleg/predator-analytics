#!/bin/bash

# Швидке підключення до сервера Predator Analytics
# Використання: ./scripts/server-connect.sh [command]

# === КОНФІГУРАЦІЯ ===
SSH_ALIAS="predator-server"
REMOTE_DIR="predator-analytics"

echo "🚀 Підключення до сервера Predator Analytics ($SSH_ALIAS)..."
echo ""

# Порти для пробросу
FORWARDS="-L 59997:localhost:59997 -L 8092:localhost:8092 -L 8090:localhost:8090 -L 5601:localhost:5601 -L 3001:localhost:3001 -L 15672:localhost:15672 -L 6443:localhost:6443"

# Команда SSH
SSH_CMD="ssh $FORWARDS"

# Якщо передано команду - виконати її на сервері
if [ -n "$1" ]; then
    echo "🔧 Виконую команду: $@"
    $SSH_CMD "$SSH_ALIAS" "cd ~/$REMOTE_DIR && $@"
else
    # Інтерактивне підключення
    echo "🔗 Інтерактивне підключення..."
    $SSH_CMD "$SSH_ALIAS"
fi
