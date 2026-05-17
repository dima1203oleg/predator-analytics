#!/bin/bash
# 🦅 PREDATOR Analytics v63.0-ELITE — Smart Sync to Server
# Автоматична синхронізація коду з автовизначенням каналів зв'язку
# Канонічна локалізація: УКРАЇНСЬКА (HR-03)

set -e

# Конфігурація за замовчуванням
SSH_KEY="$HOME/.ssh/id_ed25519_dev"
LOCAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/"
REMOTE_DIR="predator-analytics"
SSH_USER="dima"

# Кольори для виводу
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}📤 СУВЕРЕННА СИНХРОНІЗАЦІЯ PREDATOR${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${YELLOW}Локально:${NC} $LOCAL_DIR"

# 1. Сканування каналів зв'язку
echo -e "${BLUE}🔍 Аналіз доступних каналів зв'язку з NVIDIA Server...${NC}"

SSH_HOST=""
SSH_PORT=""
USE_ALIAS=""
CONN_METHOD=""

# Перевірка 1: Пряме підключення через аліас predator-server (Порт 6666)
if ssh -o ConnectTimeout=3 -o BatchMode=yes predator-server 'echo ok' &>/dev/null; then
    USE_ALIAS="predator-server"
    CONN_METHOD="Пряме підключення через аліас 'predator-server' (Порт 6666)"
# Перевірка 2: Пряме підключення через IP (Порт 6666)
elif ssh -o ConnectTimeout=3 -o BatchMode=yes -p 6666 -i "$SSH_KEY" dima@194.177.1.240 'echo ok' &>/dev/null; then
    SSH_HOST="194.177.1.240"
    SSH_PORT="6666"
    CONN_METHOD="Прямий зв'язок по IP: 194.177.1.240 (Порт 6666)"
# Перевірка 3: Тунель zrok через аліас predator-zrok (Порт 2222)
elif ssh -o ConnectTimeout=3 -o BatchMode=yes predator-zrok 'echo ok' &>/dev/null; then
    USE_ALIAS="predator-zrok"
    CONN_METHOD="Тунель zrok через аліас 'predator-zrok' (Порт 2222)"
# Перевірка 4: Тунель zrok через localhost (Порт 2222)
elif ssh -o ConnectTimeout=3 -o BatchMode=yes -p 2222 -i "$SSH_KEY" dima@127.0.0.1 'echo ok' &>/dev/null; then
    SSH_HOST="127.0.0.1"
    SSH_PORT="2222"
    CONN_METHOD="Локальний тунель zrok (127.0.0.1:2222)"
fi

# Перевірка результату виявлення
if [ -n "$USE_ALIAS" ]; then
    echo -e "${GREEN}✅ Канал знайдено: $CONN_METHOD${NC}"
    RSYNC_SSH="ssh"
    RSYNC_TARGET="$USE_ALIAS:~/$REMOTE_DIR/"
elif [ -n "$SSH_HOST" ]; then
    echo -e "${GREEN}✅ Канал знайдено: $CONN_METHOD${NC}"
    RSYNC_SSH="ssh -p $SSH_PORT -i $SSH_KEY"
    RSYNC_TARGET="$SSH_USER@$SSH_HOST:~/$REMOTE_DIR/"
else
    echo -e "${RED}❌ Помилка: Сервер NVIDIA недоступний по жодному каналу!${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${YELLOW}Перевірені канали:${NC}"
    echo "  1. Пряме підключення -> 194.177.1.240:6666 (SSH аліас 'predator-server')"
    echo "  2. Тунель zrok       -> 127.0.0.1:2222 (SSH аліас 'predator-zrok')"
    echo ""
    echo -e "${BLUE}💡 Рекомендовані дії для відновлення зв'язку:${NC}"
    echo "  А. Якщо ви не в локальній мережі, переконайтеся, що запущено тунель zrok на сервері:"
    echo "     ssh -p 6666 dima@194.177.1.240 'zrok share ...'"
    echo "  Б. Перевірте статус підключення вручну:"
    echo "     ssh predator-server"
    echo "  В. Запустіть тунель локально, якщо використовуєте zrok."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    exit 1
fi

echo -e "${YELLOW}Цільовий сервер:${NC} $RSYNC_TARGET"
echo ""

# Опції rsync
RSYNC_OPTS="-avz --progress --exclude .venv* --exclude venv* --exclude node_modules --exclude .git --exclude __pycache__ --exclude *.pyc --exclude .DS_Store --exclude dist --exclude build --exclude *.log --exclude uploads* --exclude temp_azr*"

# Виключення (Bash Array)
EXCLUDES=(
  --exclude=node_modules
  --exclude=.venv
  --exclude=venv
  --exclude=.git
  --exclude=__pycache__
  --exclude=*.pyc
  --exclude=.DS_Store
  --exclude=dist
  --exclude=build
  --exclude=.pytest_cache
  --exclude=.mypy_cache
  --exclude=logs
  --exclude=*.log
  --exclude=*.xlsx
  --exclude=*.csv
  --exclude=*.zip
  --exclude=*.gz
  --exclude=Березень_2024.csv
  --exclude=backups
  --exclude=uploads
  --exclude=uploads/
  --exclude=services/core-api/uploads
  --exclude=services/core-api/uploads/
  --exclude=temp_azr
  --exclude=temp_azr/
)

# Перевірка на --dry-run
if [ "${1:-}" == "--dry-run" ]; then
    echo -e "${YELLOW}⚠️  Режим симуляції (файли не будуть скопійовані)${NC}"
    echo ""
    RSYNC_OPTS="$RSYNC_OPTS --dry-run"
fi

# Виконання rsync
rsync $RSYNC_OPTS "${EXCLUDES[@]}" \
  -e "$RSYNC_SSH" \
  "$LOCAL_DIR" \
  "$RSYNC_TARGET"

# Перевірка результату
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Синхронізація завершена успішно!${NC}"
else
    echo ""
    echo -e "${RED}❌ Помилка синхронізації при виконанні rsync${NC}"
    exit 1
fi
