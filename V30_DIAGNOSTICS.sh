#!/bin/bash

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔍 PREDATOR V45 - Діагностика з'єднання${NC}"
echo "----------------------------------------"

# 1. Перевірка фронтенду
echo -n "🌐 Перевірка UI (localhost:3030)... "
if lsof -i :3030 > /dev/null; then
    echo -e "${GREEN}OK (Запущено)${NC}"
else
    echo -e "${RED}FAIL (Не запущено)${NC}"
    echo -e "   👉 Запустіть: npm run dev"
fi

# 2. Перевірка тунелю
echo -n "🚇 Перевірка тунелю до сервера (порт 9090)... "
if lsof -i :9090 > /dev/null; then
    echo -e "${GREEN}OK (Активний)${NC}"
else
    echo -e "${RED}FAIL (Не знайдено)${NC}"
    echo -e "   👉 Запустіть: ./scripts/server-tunnel.sh start"
fi

# 3. Перевірка відповіді сервера
echo -n "📡 Тест API (GET /api/v1/system/status)... "
STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:9090/api/v1/system/status)

if [ "$STATUS_CODE" == "200" ]; then
    echo -e "${GREEN}OK (200)${NC}"
elif [ "$STATUS_CODE" == "000" ]; then
    echo -e "${RED}FAIL (Немає з'єднання)${NC}"
else
    echo -e "${YELLOW}WARNING (Код: $STATUS_CODE)${NC}"
fi

echo "----------------------------------------"
echo -e "${GREEN}✅ Діагностика завершена${NC}"
