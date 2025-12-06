#!/bin/bash

# Перевірка статусу сервера Predator Analytics
# Використання: ./scripts/server-status.sh

SSH_KEY="$HOME/.ssh/id_ed25519_ngrok"
SSH_HOST="5.tcp.eu.ngrok.io"
SSH_PORT="14564"
SSH_USER="dima"

# Кольори
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}📊 Статус сервера Predator Analytics${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Функція для виконання команд на сервері
run_remote() {
    ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "$1" 2>/dev/null
}

# Перевірка підключення
echo -e "${YELLOW}🔌 Перевірка підключення...${NC}"
if run_remote "echo 'OK'" > /dev/null 2>&1; then
    echo -e "${GREEN}   ✅ Сервер доступний${NC}"
else
    echo -e "${RED}   ❌ Сервер недоступний${NC}"
    exit 1
fi
echo ""

# Системна інформація
echo -e "${YELLOW}💻 Системна інформація:${NC}"
run_remote "uname -a | head -n 1"
run_remote "uptime"
echo ""

# Використання диска
echo -e "${YELLOW}💾 Використання диска:${NC}"
run_remote "df -h / | tail -n 1"
echo ""

# Використання пам'яті
echo -e "${YELLOW}🧠 Використання пам'яті:${NC}"
run_remote "free -h | grep Mem"
echo ""

# Docker контейнери
echo -e "${YELLOW}🐳 Docker контейнери:${NC}"
DOCKER_OUTPUT=$(run_remote "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'")
if [ -n "$DOCKER_OUTPUT" ]; then
    echo "$DOCKER_OUTPUT"
else
    echo "   ℹ️  Контейнери не знайдено"
fi
echo ""

# Python процеси
echo -e "${YELLOW}🐍 Python процеси:${NC}"
PYTHON_COUNT=$(run_remote "ps aux | grep python | grep -v grep | wc -l")
if [ "$PYTHON_COUNT" -gt 0 ]; then
    echo -e "${GREEN}   ✅ Запущено процесів: $PYTHON_COUNT${NC}"
    run_remote "ps aux | grep python | grep -v grep | head -n 5"
else
    echo -e "${RED}   ⚠️  Python процеси не знайдено${NC}"
fi
echo ""

# Node.js процеси
echo -e "${YELLOW}📦 Node.js процеси:${NC}"
NODE_COUNT=$(run_remote "ps aux | grep node | grep -v grep | wc -l")
if [ "$NODE_COUNT" -gt 0 ]; then
    echo -e "${GREEN}   ✅ Запущено процесів: $NODE_COUNT${NC}"
else
    echo -e "${RED}   ⚠️  Node.js процеси не знайдено${NC}"
fi
echo ""

# Перевірка портів
echo -e "${YELLOW}🔌 Відкриті порти:${NC}"
run_remote "ss -tulpn 2>/dev/null | grep LISTEN | grep -E ':(8000|8080|3000|3001|5432|6379)' || echo '   ℹ️  Основні порти не прослуховуються'"
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Перевірка завершена${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
