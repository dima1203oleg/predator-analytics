#!/bin/bash

# Синхронізація коду з сервера на Mac (резервне копіювання)
# Використання: ./scripts/sync-from-server.sh [--dry-run]

SSH_KEY="$HOME/.ssh/id_ed25519_ngrok"
SSH_HOST="5.tcp.eu.ngrok.io"
SSH_PORT="14564"
SSH_USER="dima"
LOCAL_BACKUP_DIR="/Users/dima-mac/Documents/Predator_21/server-backup"
REMOTE_DIR="predator-analytics"

# Кольори для виводу
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}📥 Резервне копіювання з сервера${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${YELLOW}Сервер:${NC} $SSH_USER@$SSH_HOST:~/$REMOTE_DIR"
echo -e "${YELLOW}Локально:${NC} $LOCAL_BACKUP_DIR"
echo ""

# Створення директорії для бекапу
mkdir -p "$LOCAL_BACKUP_DIR"

# Опції rsync
RSYNC_OPTS="-avz --progress"

# Виключення
EXCLUDE_OPTS="
  --exclude 'node_modules'
  --exclude '.venv'
  --exclude 'venv'
  --exclude '__pycache__'
  --exclude '*.pyc'
  --exclude '.DS_Store'
  --exclude 'dist'
  --exclude 'build'
  --exclude '.pytest_cache'
  --exclude '.mypy_cache'
  --exclude 'logs'
  --exclude '*.log'
"

# Перевірка на --dry-run
if [ "$1" == "--dry-run" ]; then
    echo -e "${YELLOW}⚠️  Режим симуляції (файли не будуть скопійовані)${NC}"
    echo ""
    RSYNC_OPTS="$RSYNC_OPTS --dry-run"
fi

# Виконання rsync
rsync $RSYNC_OPTS $EXCLUDE_OPTS \
  -e "ssh -i $SSH_KEY -p $SSH_PORT" \
  "$SSH_USER@$SSH_HOST:~/$REMOTE_DIR/" \
  "$LOCAL_BACKUP_DIR/"

# Перевірка результату
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Резервне копіювання завершено успішно!${NC}"
    echo -e "${GREEN}📁 Файли збережено в: $LOCAL_BACKUP_DIR${NC}"
else
    echo ""
    echo -e "${RED}❌ Помилка резервного копіювання${NC}"
    exit 1
fi

echo ""
echo "💡 Підказка: Використовуйте --dry-run для перегляду змін без копіювання"
echo "   Приклад: ./scripts/sync-from-server.sh --dry-run"
