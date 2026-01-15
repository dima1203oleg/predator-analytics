#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# PREDATOR ANALYTICS v29-S - Перевірка вимог на NVIDIA сервері
# Виконувати на сервері через SSH
# ═══════════════════════════════════════════════════════════════

set -e

echo "🔍 [v29-S] Перевірка вимог на NVIDIA сервері..."
echo "═══════════════════════════════════════════════════════════════"

# Кольори
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Функція перевірки команди
check_cmd() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✅ $1 знайдено${NC}"
        return 0
    else
        echo -e "${RED}❌ $1 НЕ ЗНАЙДЕНО${NC}"
        return 1
    fi
}

echo -e "\n${BLUE}--- Системна інформація ---${NC}"
uname -a
echo ""

echo -e "${BLUE}--- Python 3.12 ---${NC}"
python3 --version
if python3 -c "import sys; exit(0) if sys.version_info >= (3, 12) else exit(1)" 2>/dev/null; then
    echo -e "${GREEN}✅ Python 3.12+ підтверджено${NC}"
else
    echo -e "${YELLOW}⚠️ Рекомендовано Python 3.12+${NC}"
fi

echo -e "\n${BLUE}--- Docker сервіси ---${NC}"
docker --version
docker compose version

echo -e "\n${BLUE}--- v29-S Контейнери ---${NC}"
REQUIRED_CONTAINERS=("predator_postgres" "predator_redis" "predator_backend" "predator_frontend" "predator_som")
for container in "${REQUIRED_CONTAINERS[@]}"; do
    if docker ps --format '{{.Names}}' | grep -q "$container"; then
        STATUS=$(docker inspect --format='{{.State.Status}}' "$container" 2>/dev/null || echo "unknown")
        echo -e "${GREEN}✅ $container: $STATUS${NC}"
    else
        echo -e "${RED}❌ $container: не запущено${NC}"
    fi
done

echo -e "\n${BLUE}--- v29-S API Перевірка ---${NC}"
# SOM API
if curl -s http://localhost:8095/api/v1/som/health | grep -q "healthy"; then
    echo -e "${GREEN}✅ SOM API: здоровий${NC}"
else
    echo -e "${RED}❌ SOM API: недоступний${NC}"
fi

# Backend API
if curl -s http://localhost:8000/health | grep -q "ok\|healthy"; then
    echo -e "${GREEN}✅ Backend API: здоровий${NC}"
else
    echo -e "${YELLOW}⚠️ Backend API: перевірте статус${NC}"
fi

echo -e "\n${BLUE}--- Конституційне Ядро v29-S ---${NC}"
AXIOMS_RESPONSE=$(curl -s http://localhost:8095/api/v1/som/axioms 2>/dev/null)
if echo "$AXIOMS_RESPONSE" | grep -q '"is_valid": true'; then
    AXIOM_COUNT=$(echo "$AXIOMS_RESPONSE" | grep -o '"total": [0-9]*' | grep -o '[0-9]*')
    echo -e "${GREEN}✅ Конституційні Аксіоми: $AXIOM_COUNT аксіом завантажено${NC}"
else
    echo -e "${RED}❌ Конституційні Аксіоми: помилка завантаження${NC}"
fi

echo -e "\n${BLUE}--- Truth Ledger ---${NC}"
LEDGER_RESPONSE=$(curl -s http://localhost:8095/api/v1/ledger/entries 2>/dev/null)
if echo "$LEDGER_RESPONSE" | grep -q '"chain_valid": true'; then
    ENTRY_COUNT=$(echo "$LEDGER_RESPONSE" | grep -o '"total": [0-9]*' | grep -o '[0-9]*')
    echo -e "${GREEN}✅ Truth Ledger: $ENTRY_COUNT записів, ланцюг валідний${NC}"
else
    echo -e "${YELLOW}⚠️ Truth Ledger: перевірте статус${NC}"
fi

echo -e "\n${BLUE}--- GPU (NVIDIA) ---${NC}"
if command -v nvidia-smi &> /dev/null; then
    nvidia-smi --query-gpu=name,memory.total,memory.free,utilization.gpu --format=csv,noheader
    echo -e "${GREEN}✅ NVIDIA GPU доступний${NC}"
else
    echo -e "${YELLOW}⚠️ nvidia-smi недоступний${NC}"
fi

echo -e "\n${BLUE}--- Використання ресурсів ---${NC}"
echo "CPU: $(nproc) ядер"
free -h | grep Mem
df -h / | tail -1

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ Перевірка v29-S завершена${NC}"
echo "═══════════════════════════════════════════════════════════════"
