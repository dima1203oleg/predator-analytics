#!/bin/bash
# ============================================================
# PREDATOR Analytics — Деплой бекенду на NVIDIA (194.177.1.240)
# Встановлює: Python 3.12, PostgreSQL 16, Redis 7
# Запускає: Core API на порту 8000
# ============================================================
set -euo pipefail

NVIDIA_IP="194.177.1.240"
NVIDIA_USER="dima"
SSH_KEY="$HOME/.ssh/id_ed25519_dev"
SSH_CMD="ssh -i $SSH_KEY -p 6666 -o StrictHostKeyChecking=no $NVIDIA_USER@$NVIDIA_IP"
SUDO_PASS="1204"

# Допоміжна функція: виконати команду на NVIDIA з sudo
NVIDIA_sudo() {
    $SSH_CMD "echo '$SUDO_PASS' | sudo -S $*"
}

NVIDIA_run() {
    $SSH_CMD "$*"
}

echo "=== КРОК 1: Перевірка Homebrew ==="
if NVIDIA_run "test -f /usr/local/bin/brew" 2>/dev/null; then
    echo "Homebrew вже встановлено"
else
    echo "Homebrew не знайдено — встановлення..."
    NVIDIA_run 'NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
    # Додавання brew до PATH
    NVIDIA_run 'echo "eval \$(/usr/local/bin/brew shellenv)" >> ~/.zprofile'
    NVIDIA_run 'eval $(/usr/local/bin/brew shellenv)'
fi

BREW="NVIDIA_run /usr/local/bin/brew"

echo "=== КРОК 2: Встановлення PostgreSQL 16 ==="
if NVIDIA_run "test -f /usr/local/bin/pg_isready" 2>/dev/null; then
    echo "PostgreSQL вже встановлено"
else
    $BREW install postgresql@16
    # Запуск сервісу
    NVIDIA_sudo "cp /usr/local/opt/postgresql@16/homebrew.mxcl.postgresql@16.plist /Library/LaunchDaemons/ 2>/dev/null || true"
    NVIDIA_run "/usr/local/opt/postgresql@16/bin/pg_ctl -D /usr/local/var/postgresql@16 start" || true
fi

echo "=== КРОК 3: Встановлення Redis ==="
if NVIDIA_run "test -f /usr/local/bin/redis-server" 2>/dev/null; then
    echo "Redis вже встановлено"
else
    $BREW install redis
    NVIDIA_sudo "cp /usr/local/opt/redis/homebrew.mxcl.redis.plist /Library/LaunchDaemons/ 2>/dev/null || true"
    NVIDIA_run "/usr/local/opt/redis/bin/redis-server --daemonize yes" || true
fi

echo "=== КРОК 4: Встановлення Python 3.12 ==="
if NVIDIA_run "python3.12 --version" 2>/dev/null; then
    echo "Python 3.12 вже встановлено"
else
    $BREW install python@3.12
    NVIDIA_run "ln -sf /usr/local/bin/python3.12 /usr/local/bin/python3" 2>/dev/null || true
fi

echo "=== КРОК 5: Налаштування PostgreSQL ==="
# Створення користувача та БД
NVIDIA_run "/usr/local/bin/psql -U $NVIDIA_USER -d postgres -c \"CREATE USER predator WITH PASSWORD 'predator' SUPERUSER;\"" 2>/dev/null || echo "User predator вже існує"
NVIDIA_run "/usr/local/bin/psql -U $NVIDIA_USER -d postgres -c \"CREATE DATABASE predator OWNER predator;\"" 2>/dev/null || echo "DB predator вже існує"
NVIDIA_run "/usr/local/bin/psql -U $NVIDIA_USER -d predator -c \"CREATE EXTENSION IF NOT EXISTS \\\"uuid-ossp\\\"; CREATE EXTENSION IF NOT EXISTS \\\"pgcrypto\\\"; CREATE EXTENSION IF NOT EXISTS \\\"pg_trgm\\\"; CREATE EXTENSION IF NOT EXISTS \\\"btree_gin\\\";\"" 2>/dev/null || true

echo "=== КРОК 6: Копіювання коду на NVIDIA ==="
rsync -az --delete \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='.venv' \
    --exclude='venv' \
    --exclude='__pycache__' \
    --exclude='.DS_Store' \
    --exclude='*.pyc' \
    --exclude='dist' \
    --exclude='coverage' \
    --exclude='.pytest_cache' \
    --exclude='mlruns' \
    -e "ssh -i $SSH_KEY -p 6666 -o StrictHostKeyChecking=no" \
    /Users/Shared/Predator_60/ \
    $NVIDIA_USER@$NVIDIA_IP:~/Predator_60/

echo "=== КРОК 7: Встановлення Python-залежностей ==="
NVIDIA_run "cd ~/Predator_60/services/core-api && python3.12 -m venv .venv && source .venv/bin/activate && pip install --upgrade pip && pip install -r requirements.txt"

echo "=== КРОК 8: Міграції та seed ==="
NVIDIA_run "cd ~/Predator_60/services/core-api && source .venv/bin/activate && export DATABASE_URL='postgresql+asyncpg://predator:predator@127.0.0.1:5432/predator' && alembic upgrade head" || echo "Міграції: використовуємо init.sql"
NVIDIA_run "cd ~/Predator_60 && /usr/local/bin/psql -U predator -d predator -f db/postgres/init.sql" || echo "init.sql вже застосовано"

echo "=== КРОК 9: Запуск Core API ==="
NVIDIA_run "cd ~/Predator_60/services/core-api && source .venv/bin/activate && nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2 > ~/predator_api.log 2>&1 &"

echo ""
echo "=== ГОТОВО ==="
echo "Core API: http://$NVIDIA_IP:8000"
echo "Health:   http://$NVIDIA_IP:8000/api/v1/health"
echo "Docs:     http://$NVIDIA_IP:8000/api/docs"
