#!/bin/bash
set -e

# Кольори для виводу
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # Без кольору

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🚀 Запуск розгортання Predator v45 | Neural Analytics.0 на NVIDIA сервері...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 0. Перехід в корінь проекту
cd "$(dirname "$0")/.."

# 1. Оновлення коду (відключено, використовується rsync)
echo -e "${YELLOW}📥 Оновлення коду (код вже синхронізовано через rsync)...${NC}"
# git config pull.rebase false
# git stash
# git pull origin main
# git stash pop || true

# 2. Перевірка конфігурації
if [ ! -f .env ]; then
    echo -e "${RED}⚠️ Файл .env відсутній! Створення з прикладу...${NC}"
    cp .env.example .env
    echo "Будь ласка, відредагуйте .env та запустіть скрипт знову."
    exit 1
fi

# 3. Збірка сервісів
echo -e "${YELLOW}🏗️ Збірка Docker образів (з підтримкою GPU)...${NC}"
docker compose --profile server build backend orchestrator frontend

# 4. Перезапуск сервісів
echo -e "${YELLOW}🔄 Перезапуск контейнерів...${NC}"
docker compose --profile server up -d --remove-orphans

# 5. Перевірка стану (Health Check)
echo -e "${YELLOW}🏥 Перевірка працездатності (очікування 15с)...${NC}"
sleep 15
if curl -s -f http://localhost:8090/health > /dev/null; then
    echo -e "${GREEN}✅ Backend API працює стабільно!${NC}"
else
    echo -e "${RED}❌ Помилка перевірки стану бекенду.${NC}"
    echo "Останні 20 рядків логів бекенду:"
    docker compose logs --tail=20 backend
fi

# 6. Статус GPU
if command -v nvidia-smi &> /dev/null; then
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}🎮 Статус NVIDIA GPU:${NC}"
    nvidia-smi --query-gpu=name,utilization.gpu,memory.used --format=csv,noheader
fi

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Розгортання завершено успішно!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
