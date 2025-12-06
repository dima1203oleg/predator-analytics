#!/bin/bash

# Запуск веб-інтерфейсів Predator Analytics на сервері
# Використання: ./scripts/server-start-web.sh

SSH_KEY="$HOME/.ssh/id_ed25519_ngrok"
SSH_HOST="5.tcp.eu.ngrok.io"
SSH_PORT="14651"
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
echo ""

# Функція для виконання команд на сервері
run_remote() {
    ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "$1"
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
echo -e "${YELLOW}🐳 Перевірка Docker контейнерів...${NC}"
CONTAINERS=$(run_remote "docker ps -a --format '{{.Names}}\t{{.Status}}' | grep -E '(frontend|grafana|backend)'")
echo "$CONTAINERS"
echo ""

# Запуск контейнерів
echo -e "${YELLOW}🔄 Запуск контейнерів...${NC}"

# Frontend
echo -e "${BLUE}📱 Запуск Frontend...${NC}"
run_remote "docker start predator10-frontend 2>&1" > /dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}   ✅ Frontend запущено${NC}"
else
    echo -e "${RED}   ⚠️  Помилка запуску Frontend${NC}"
fi

# Grafana
echo -e "${BLUE}📊 Запуск Grafana...${NC}"
run_remote "docker start predator-grafana 2>&1" > /dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}   ✅ Grafana запущено${NC}"
else
    echo -e "${RED}   ⚠️  Помилка запуску Grafana${NC}"
fi

echo ""

# Перевірка портів
echo -e "${YELLOW}🔍 Перевірка доступності портів...${NC}"
PORTS=$(run_remote "ss -tulpn 2>/dev/null | grep LISTEN | grep -E ':(8082|3001|8000)'")
if [ -n "$PORTS" ]; then
    echo -e "${GREEN}✅ Порти відкриті:${NC}"
    echo "$PORTS" | while read line; do
        echo "   $line"
    done
else
    echo -e "${YELLOW}⚠️  Порти ще не відкриті (зачекайте кілька секунд)${NC}"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Веб-інтерфейси запущено!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Перевірка SSH-тунелю
echo -e "${YELLOW}🚇 Перевірка SSH-тунелю...${NC}"
if lsof -i:9082 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ SSH-тунель активний${NC}"
    echo ""
    echo -e "${GREEN}🌐 Доступні посилання:${NC}"
    echo -e "   ${BLUE}Frontend:${NC} http://localhost:9082"
    echo -e "   ${BLUE}Grafana:${NC}  http://localhost:9001"
    echo ""
    echo -e "${YELLOW}💡 Відкрити у браузері:${NC}"
    echo -e "   web-frontend  # або: open http://localhost:9082"
    echo -e "   web-grafana   # або: open http://localhost:9001"
    echo -e "   web-all       # Відкрити все"
else
    echo -e "${YELLOW}⚠️  SSH-тунель не активний${NC}"
    echo ""
    echo -e "${YELLOW}💡 Запустіть тунель:${NC}"
    echo -e "   ./scripts/server-tunnel.sh start"
    echo ""
    echo -e "${YELLOW}Або запустити зараз? (y/n):${NC}"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        ./scripts/server-tunnel.sh start
    fi
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
