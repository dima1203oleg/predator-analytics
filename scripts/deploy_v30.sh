#!/bin/bash
# ============================================
# PREDATOR V30 - Ultra Sync & Deploy Script
# ============================================
# Цей скрипт синхронізує фронтенд між локальною машиною та сервером.
# Запуск: ./scripts/deploy_v30.sh
# ============================================

set -e

# Кольори
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Конфігурація
SERVER="predator-server"
SERVER_IP="194.177.1.240"
SERVER_PORT="6666"
SERVER_USER="dima"
REMOTE_BASE="/home/dima/predator-analytics"
REMOTE_DIST="$REMOTE_BASE/apps/predator-analytics-ui/dist"
LOCAL_DIST="/Users/dima-mac/Documents/Predator_21/apps/predator-analytics-ui/dist"
LOCAL_PROJECT="/Users/dima-mac/Documents/Predator_21/apps/predator-analytics-ui"

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║       PREDATOR V30 - SYNC & DEPLOY                           ║"
echo "║       Синхронізація локальних змін на сервер                 ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# 1. Перевірка доступності сервера
echo -e "${YELLOW}[1/5] Перевірка доступності сервера...${NC}"
if ssh -q -o ConnectTimeout=5 "$SERVER" exit 2>/dev/null; then
    echo -e "${GREEN}✓ Сервер онлайн${NC}"
    SERVER_ONLINE=true
else
    echo -e "${RED}✗ Сервер недоступний через SSH alias${NC}"
    echo -e "${YELLOW}   Спроба прямого підключення...${NC}"

    if ssh -q -o ConnectTimeout=5 -p $SERVER_PORT $SERVER_USER@$SERVER_IP exit 2>/dev/null; then
        echo -e "${GREEN}✓ Пряме підключення успішне${NC}"
        SERVER="$SERVER_USER@$SERVER_IP -p $SERVER_PORT"
        SERVER_ONLINE=true
    else
        echo -e "${RED}✗ Сервер повністю недоступний${NC}"
        echo ""
        echo -e "${YELLOW}Можливі причини:${NC}"
        echo "  1. macOS блокує SSH (запустіть FIX_MACOS_PERMISSIONS.sh)"
        echo "  2. VPN не підключений"
        echo "  3. Сервер офлайн"
        echo ""
        echo -e "${CYAN}Запуск локального сервера розробки...${NC}"
        cd "$LOCAL_PROJECT" && npm run dev
        exit 0
    fi
fi

# 2. Збірка проекту локально
echo ""
echo -e "${YELLOW}[2/5] Збірка проекту...${NC}"
cd "$LOCAL_PROJECT"

# Видаляємо попередню збірку
rm -rf dist 2>/dev/null || true

# Збірка
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}✗ Помилка збірки: dist не створено${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Збірка завершена${NC}"

# 3. Підрахунок змін
echo ""
echo -e "${YELLOW}[3/5] Аналіз файлів для синхронізації...${NC}"
FILE_COUNT=$(find dist -type f | wc -l | tr -d ' ')
TOTAL_SIZE=$(du -sh dist | cut -f1)
echo -e "   📁 Файлів: ${CYAN}$FILE_COUNT${NC}"
echo -e "   📦 Розмір: ${CYAN}$TOTAL_SIZE${NC}"

# 4. Синхронізація на сервер
echo ""
echo -e "${YELLOW}[4/5] Передача файлів на сервер...${NC}"

# Створюємо директорію на сервері
ssh $SERVER "mkdir -p $REMOTE_DIST" 2>/dev/null

# rsync з прогресом
rsync -avz --delete --progress "$LOCAL_DIST/" "$SERVER:$REMOTE_DIST/"

echo -e "${GREEN}✓ Файли синхронізовано${NC}"

# 5. Перезапуск контейнера
echo ""
echo -e "${YELLOW}[5/5] Перезапуск веб-сервера...${NC}"

ssh $SERVER "docker restart predator-fixed-frontend 2>/dev/null || docker restart predator_frontend 2>/dev/null" || {
    echo -e "${YELLOW}   Контейнер не знайдено, запускаємо новий...${NC}"
    ssh $SERVER "docker run -d --name predator-fixed-frontend \
        -p 8080:80 \
        -v $REMOTE_DIST:/usr/share/nginx/html:ro \
        nginx:alpine" 2>/dev/null
}

echo -e "${GREEN}✓ Веб-сервер перезапущено${NC}"

# Підсумок
echo ""
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🎉 ГОТОВО! V30 успішно розгорнуто на сервері.${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "🔗 ${YELLOW}Локальний UI:${NC}  http://localhost:3030"
echo -e "🔗 ${YELLOW}Сервер UI:${NC}     http://$SERVER_IP:8080"
echo -e "🔗 ${YELLOW}Публічний:${NC}     https://jolyn-bifid-eligibly.ngrok-free.dev"
echo ""
