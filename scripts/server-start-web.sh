#!/bin/bash

# Запуск веб-інтерфейсів Predator Analytics на сервері
# Використання: ./scripts/server-start-web.sh

# === КОНФІГУРАЦІЯ ===
SSH_HOST="194.177.1.240"
SSH_PORT="6666"
SSH_USER="dima"

# Кольори
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🚀 Запуск веб-інтерфейсів на сервері${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "📍 Сервер: ${YELLOW}$SSH_HOST:$SSH_PORT${NC}"
echo ""

# SSH опції
SSH_OPTS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=10"

# Функція для виконання команд на сервері
run_remote() {
    ssh $SSH_OPTS -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "$1"
}

# Перевірка підключення
echo -e "${YELLOW}🔌 Перевірка підключення до сервера...${NC}"
if ! run_remote "echo 'OK'" > /dev/null 2>&1; then
    echo -e "${RED}❌ Не вдалося підключитися до сервера${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Підключення встановлено${NC}"
echo ""

# Перевірка статусу контейнерів
echo -e "${YELLOW}🐳 Статус Docker сервісів...${NC}"
run_remote "cd ~/predator-analytics && docker compose ps" 2>/dev/null
echo ""

# Запуск контейнерів якщо потрібно
echo -e "${YELLOW}🔄 Перевірка та запуск сервісів...${NC}"
run_remote "cd ~/predator-analytics && docker compose up -d" 2>/dev/null
echo ""

# Перевірка портів
echo -e "${YELLOW}🔍 Перевірка доступності портів...${NC}"
PORTS=$(run_remote "ss -tulpn 2>/dev/null | grep LISTEN | grep -E ':(3000|8000|5432|6379)' | head -10")
if [ -n "$PORTS" ]; then
    echo -e "${GREEN}✅ Порти відкриті:${NC}"
    echo "$PORTS"
else
    echo -e "${YELLOW}⚠️  Порти ще не відкриті (зачекайте кілька секунд)${NC}"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Веб-інтерфейси запущено!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}🌐 Доступні посилання:${NC}"
echo -e "   ${BLUE}Canonical Link:${NC} ${GREEN}https://2e41c24fa38f0d.lhr.life/${NC}"
echo -e "   ${BLUE}Frontend Port:${NC}  http://$SSH_HOST:3000"
echo -e "   ${BLUE}Backend Port:${NC}   http://$SSH_HOST:8000"
echo -e "   ${BLUE}API Docs:${NC}      http://$SSH_HOST:8000/docs"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
