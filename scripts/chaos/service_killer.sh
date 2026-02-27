#!/bin/bash
# 🐵 Chaos Monkey for Predator Analytics v45
# Скрипт для ін'єкції збоїв у локальне середовище Docker Compose

# Кольори
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

TARGETS=("predator_backend" "predator_celery_worker" "predator_orchestrator")

echo -e "${RED}🔥 CHAOS MONKEY ЗАПУЩЕНО...${NC}"
echo "Ціль: Перевірка самовідновлення сервісів (Self-Healing)"

# 1. Випадкове вбивство сервісу
TARGET=${TARGETS[$RANDOM % ${#TARGETS[@]}]}
echo -e "${YELLOW}🎯 Обрана ціль:${NC} $TARGET"

echo "💀 Вбиваємо процес (kill)..."
docker kill $TARGET

echo -e "${YELLOW}⏱️  Очікуємо автоматичного відновлення (10с)...${NC}"
sleep 10

# 2. Перевірка статусу
STATUS=$(docker inspect -f '{{.State.Status}}' $TARGET 2>/dev/null)

if [ "$STATUS" == "running" ]; then
    echo -e "${GREEN}✅ ТЕСТ ПРОЙДЕНО: Сервіс $TARGET успішно відновився!${NC}"
    exit 0
else
    echo -e "${RED}❌ ТЕСТ ПРОВАЛЕНО: Сервіс $TARGET знаходиться у стані $STATUS${NC}"
    echo "Необхідно перевірити restart policy у docker-compose.yml"
    exit 1
fi
