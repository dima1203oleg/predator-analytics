#!/bin/bash
# ============================================
# PREDATOR V45 - Remote Build & Deploy
# ============================================
# Синхронізує вихідний код на сервер і виконує збірку там
# Обходить проблеми з локальними permissions
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

SERVER="predator-server"
LOCAL_SRC="/Users/dima-mac/Documents/Predator_21/apps/predator-analytics-ui"
REMOTE_BASE="/home/dima/predator-analytics/apps/predator-analytics-ui"

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║       PREDATOR V45 - REMOTE BUILD & DEPLOY                   ║"
echo "║       Збірка виконується на сервері                          ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# 1. Перевірка SSH
echo -e "${YELLOW}[1/4] Перевірка підключення до сервера...${NC}"
if ! ssh -q -o ConnectTimeout=5 "$SERVER" exit 2>/dev/null; then
    echo -e "${RED}✗ Сервер недоступний${NC}"
    echo "Спробуйте запустити в звичайному Terminal.app"
    exit 1
fi
echo -e "${GREEN}✓ Сервер онлайн${NC}"

# 2. Синхронізація вихідного коду (без node_modules та dist)
echo ""
echo -e "${YELLOW}[2/4] Синхронізація вихідного коду...${NC}"
rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude 'dist' \
    --exclude '.git' \
    --exclude '.cache' \
    "$LOCAL_SRC/" "$SERVER:$REMOTE_BASE/"

echo -e "${GREEN}✓ Код синхронізовано${NC}"

# 3. Збірка на сервері
echo ""
echo -e "${YELLOW}[3/4] Запуск збірки на сервері...${NC}"
ssh "$SERVER" "cd $REMOTE_BASE && npm install --legacy-peer-deps && npm run build"

echo -e "${GREEN}✓ Збірка завершена${NC}"

# 4. Перезапуск контейнера
echo ""
echo -e "${YELLOW}[4/4] Перезапуск веб-сервера...${NC}"
ssh "$SERVER" "docker restart predator-fixed-frontend 2>/dev/null || docker restart predator_frontend 2>/dev/null" || {
    echo -e "${YELLOW}   Запускаємо новий контейнер...${NC}"
    ssh "$SERVER" "docker run -d --name predator-fixed-frontend \
        -p 8080:80 \
        -v $REMOTE_BASE/dist:/usr/share/nginx/html:ro \
        nginx:alpine" 2>/dev/null
}

echo -e "${GREEN}✓ Веб-сервер перезапущено${NC}"

# Підсумок
echo ""
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🎉 ГОТОВО! V45 успішно розгорнуто.${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo ""
