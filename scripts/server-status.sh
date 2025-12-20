#!/bin/bash

# Перевірка статусу сервера Predator Analytics
# Використання: ./scripts/server-status.sh

# === КОНФІГУРАЦІЯ ===
SSH_HOST="194.177.1.240"
SSH_PORT="6666"
SSH_USER="dima"
SSH_KEY="$HOME/.ssh/id_ed25519_ngrok"

# Кольори
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}📊 Статус сервера Predator Analytics${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "📍 Сервер: ${YELLOW}$SSH_HOST:$SSH_PORT${NC}"
echo ""

# SSH опції
SSH_OPTS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=10"
if [ -f "$SSH_KEY" ]; then
    SSH_OPTS="-i $SSH_KEY $SSH_OPTS"
fi

# Функція для виконання команд на сервері
run_remote() {
    ssh $SSH_OPTS -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "$1" 2>/dev/null
}

# Перевірка підключення
echo -e "${YELLOW}🔌 Перевірка підключення...${NC}"
if run_remote "echo 'OK'" > /dev/null 2>&1; then
    echo -e "${GREEN}   ✅ Сервер доступний${NC}"
else
    echo -e "${RED}   ❌ Сервер недоступний${NC}"
    echo -e "${YELLOW}   💡 Підказка: перевірте ssh -p $SSH_PORT $SSH_USER@$SSH_HOST${NC}"
    exit 1
fi
echo ""

# GPU інформація
echo -e "${YELLOW}🎮 NVIDIA GPU:${NC}"
run_remote "nvidia-smi --query-gpu=name,memory.used,memory.total,utilization.gpu --format=csv,noheader 2>/dev/null || echo '   ℹ️  nvidia-smi недоступний'"
echo ""

# Системна інформація
echo -e "${YELLOW}💻 Системна інформація:${NC}"
run_remote "hostname && uptime"
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
DOCKER_OUTPUT=$(run_remote "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' 2>/dev/null")
if [ -n "$DOCKER_OUTPUT" ]; then
    echo "$DOCKER_OUTPUT"
else
    echo "   ℹ️  Контейнери не знайдено"
fi
echo ""

# Predator сервіси
echo -e "${YELLOW}🦅 Predator сервіси:${NC}"
run_remote "cd ~/predator-analytics && docker compose ps 2>/dev/null | head -10 || echo '   ℹ️  docker compose ps не доступний'"
echo ""

# Перевірка портів
echo -e "${YELLOW}🔌 Ключові порти:${NC}"
run_remote "ss -tulpn 2>/dev/null | grep LISTEN | grep -E ':(8000|8080|3000|3001|5432|6379)' | head -10 || echo '   ℹ️  Основні порти не прослуховуються'"
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Перевірка завершена${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
