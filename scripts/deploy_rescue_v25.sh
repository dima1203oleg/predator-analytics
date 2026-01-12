#!/bin/bash
# ------------------------------------------------------------------
# PREDATOR ANALYTICS v25 - RESCUE DEPLOYMENT SCRIPT (UKRAINIAN)
# ------------------------------------------------------------------
# Цей скрипт призначений для примусового розгортання оновлень на сервері,
# коли стандартні методи (rsync/alias) не працюють.
# ------------------------------------------------------------------

# Налаштування (Змініть, якщо потрібно)
REMOTE_USER="dima"
REMOTE_HOST="194.177.1.240"
REMOTE_PORT="6666"
REMOTE_DIR="~/predator-analytics"
SSH_KEY="$HOME/.ssh/id_ed25519_ngrok" # Або інший ключ

# Кольори для виводу
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 ПОЧАТОК АВАРІЙНОГО РОЗГОРТАННЯ V25 (OMNISCIENCE UI)${NC}"

# 1. Перевірка наявності ключа
if [ ! -f "$SSH_KEY" ]; then
    echo -e "${RED}❌ Помилка: SSH ключ не знайдено за адресою $SSH_KEY${NC}"
    echo "Спробуйте вказати правильний шлях до ключа у скрипті."
    exit 1
fi

# 2. Перевірка з'єднання
echo -e "${YELLOW}📡 Перевірка з'єднання з сервером $REMOTE_HOST...${NC}"
if ssh -4 -i "$SSH_KEY" -p "$REMOTE_PORT" -o ConnectTimeout=5 -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "echo 'Connection OK'"; then
    echo -e "${GREEN}✅ З'єднання встановлено!${NC}"
else
    echo -e "${RED}❌ Не вдалося підключитися до сервера.${NC}"
    echo "Перевірте VPN, Firewall або правильність IP-адреси."
    exit 1
fi

# 3. Підготовка архіву (швидше ніж передача тисяч дрібних файлів)
echo -e "${YELLOW}📦 Архівація фронтенду...${NC}"
TAR_NAME="frontend_v25_deploy.tar.gz"
# Виключаємо node_modules, dist та інші непотрібні файли
tar -czf "$TAR_NAME" -C apps/frontend . --exclude=node_modules --exclude=dist --exclude=.git

# 4. Передача архіву на сервер
echo -e "${YELLOW}⬆️ Завантаження архіву на сервер...${NC}"
scp -4 -i "$SSH_KEY" -P "$REMOTE_PORT" "$TAR_NAME" "$REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/apps/frontend_temp.tar.gz"

# 5. Розпаковка та збірка на сервері
echo -e "${YELLOW}🏗️ Розпаковка та перезбірка на сервері...${NC}"
ssh -4 -i "$SSH_KEY" -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" << EOF
    set -e
    cd $REMOTE_DIR

    echo "📥 Розпаковка..."
    # Очищуємо стару папку frontend (зберігаючи Dockerfile, якщо він там окремо, але краще перезаписати)
    mkdir -p apps/frontend
    tar -xzf apps/frontend_temp.tar.gz -C apps/frontend
    rm apps/frontend_temp.tar.gz

    echo "🐳 Перезбірка Docker контейнера (Frontend)..."
    docker compose up -d --build --force-recreate frontend

    echo "🧹 Очистка..."
    docker image prune -f
EOF

# 6. Прибирання локального архіву
rm "$TAR_NAME"

echo -e "${GREEN}✅ РОЗГОРТАННЯ ЗАВЕРШЕНО УСПІШНО!${NC}"
echo -e "${GREEN}🌍 Інтерфейс доступний за адресою: http://$REMOTE_HOST${NC}"
