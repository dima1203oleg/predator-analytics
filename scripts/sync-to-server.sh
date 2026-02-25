#!/bin/bash

# Синхронізація коду з Mac на сервер (Static IP)
# Використання: ./scripts/sync-to-server.sh [--dry-run]

SSH_KEY="$HOME/.ssh/id_ed25519_ngrok" # Key for server access
SSH_HOST="194.177.1.240"
SSH_PORT="6666"
SSH_USER="dima"
LOCAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/"
REMOTE_DIR="predator-analytics"

# Кольори для виводу
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}📤 Синхронізація коду на сервер${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${YELLOW}Локально:${NC} $LOCAL_DIR"
echo -e "${YELLOW}Сервер:${NC} $SSH_USER@$SSH_HOST:~/$REMOTE_DIR"
echo ""

# Опції rsync
RSYNC_OPTS="-avz --progress --exclude .venv* --exclude venv* --exclude node_modules --exclude .git --exclude __pycache__ --exclude *.pyc --exclude .DS_Store --exclude dist --exclude build --exclude *.log"

# Виключення
EXCLUDE_OPTS="
  --exclude node_modules
  --exclude .venv
  --exclude venv
  --exclude .git
  --exclude __pycache__
  --exclude *.pyc
  --exclude .DS_Store
  --exclude dist
  --exclude build
  --exclude .pytest_cache
  --exclude .mypy_cache
  --exclude logs
  --exclude *.log
"

# Перевірка на --dry-run
if [ "$1" == "--dry-run" ]; then
    echo -e "${YELLOW}⚠️  Режим симуляції (файли не будуть скопійовані)${NC}"
    echo ""
    RSYNC_OPTS="$RSYNC_OPTS --dry-run"
fi

# Виконання rsync
rsync $RSYNC_OPTS $EXCLUDE_OPTS \
  -e "ssh -i $SSH_KEY -p $SSH_PORT -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null" \
  "$LOCAL_DIR" \
  "$SSH_USER@$SSH_HOST:~/$REMOTE_DIR/"

# Перевірка результату
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Синхронізація завершена успішно!${NC}"
else
    echo ""
    echo -e "${RED}❌ Помилка синхронізації${NC}"
    exit 1
fi

echo ""
echo "💡 Підказка: Використовуйте --dry-run для перегляду змін без копіювання"
echo "   Приклад: ./scripts/sync-to-server.sh --dry-run"
