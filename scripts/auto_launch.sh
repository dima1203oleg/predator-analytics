#!/bin/bash
# Predator Analytics - Повний автоматизований запуск з моніторингом

set -e

echo "🚀 PREDATOR ANALYTICS - FULL AUTO LAUNCH"
echo "=========================================="
echo ""

# Кольори для виводу
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# ==================== КРОК 1: ПЕРЕВІРКА СИСТЕМИ ====================

log_info "Крок 1/7: Перевірка системи..."
echo ""

# Перевірка Docker
if ! command -v docker &> /dev/null; then
    log_error "Docker не встановлено!"
    exit 1
fi
log_success "Docker встановлено"

# Перевірка Python
if ! command -v python3 &> /dev/null; then
    log_error "Python3 не встановлено!"
    exit 1
fi
log_success "Python3: $(python3 --version)"

# Перевірка Node (для frontend)
if command -v node &> /dev/null; then
    log_success "Node: $(node --version)"
else
    log_warning "Node не встановлено (frontend може не працювати)"
fi

echo ""

# ==================== КРОК 2: ЗАПУСК DOCKER ====================

log_info "Крок 2/7: Запуск Docker containers..."
echo ""

# Перевірка чи Docker daemon запущений
if ! docker info &> /dev/null; then
    log_error "Docker daemon не запущений!"
    log_info "Запусти Docker Desktop або docker daemon"
    exit 1
fi

# Запуск containers
log_info "Запускаю docker compose..."
cd /Users/dima-mac/Documents/Predator_21

if docker compose up -d --build; then
    log_success "Docker containers запущені"
else
    log_error "Помилка запуску Docker containers"
    exit 1
fi

echo ""

# Чекаємо поки контейнери стартують
log_info "Чекаю старту сервісів (10 секунд)..."
sleep 10

echo ""

# ==================== КРОК 3: ПЕРЕВІРКА СЕРВІСІВ ====================

log_info "Крок 3/7: Перевірка сервісів..."
echo ""

# Функція для перевірки HTTP endpoint
check_endpoint() {
    local url=$1
    local name=$2
    local max_attempts=5
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200\|301\|302"; then
            log_success "$name доступний: $url"
            return 0
        fi
        log_warning "$name недоступний, спроба $attempt/$max_attempts..."
        sleep 2
        attempt=$((attempt + 1))
    done

    log_error "$name недоступний після $max_attempts спроб"
    return 1
}

# Перевірка Frontend
check_endpoint "http://localhost:3000" "Frontend" || FRONTEND_FAILED=true

# Перевірка Backend
check_endpoint "http://localhost:8000/health" "Backend API" || BACKEND_FAILED=true

# Перевірка Redis (через redis-cli якщо є)
if docker exec $(docker ps -q -f name=redis) redis-cli ping &> /dev/null; then
    log_success "Redis доступний"
else
    log_warning "Redis недоступний"
fi

echo ""

# ==================== КРОК 4: ТЕСТУВАННЯ UI ====================

log_info "Крок 4/7: Тестування UI сторінок..."
echo ""

if [ -z "$FRONTEND_FAILED" ]; then
    # Тестуємо основні сторінки
    PAGES=(
        "/:Dashboard"
        "/search:Search"
        "/monitoring:Monitoring"
    )

    WORKING=0
    FAILED=0

    for page in "${PAGES[@]}"; do
        IFS=':' read -r path name <<< "$page"
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$path" 2>/dev/null)

        if [ "$HTTP_CODE" == "200" ]; then
            log_success "$name - OK"
            WORKING=$((WORKING + 1))
        else
            log_error "$name - Error $HTTP_CODE"
            FAILED=$((FAILED + 1))
        fi
    done

    echo ""
    log_info "Результат UI: $WORKING OK, $FAILED Failed"
else
    log_warning "Пропускаю тест UI (Frontend недоступний)"
fi

echo ""

# ==================== КРОК 5: НАЛАШТУВАННЯ TELEGRAM ====================

log_info "Крок 5/7: Перевірка Telegram конфігурації..."
echo ""

if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
    log_warning "TELEGRAM_BOT_TOKEN не встановлено"
    echo ""
    read -p "Введи токен від @BotFather (або Enter для пропуску): " BOT_TOKEN
    if [ -n "$BOT_TOKEN" ]; then
        export TELEGRAM_BOT_TOKEN="$BOT_TOKEN"
        log_success "Token встановлено"
    fi
else
    log_success "TELEGRAM_BOT_TOKEN встановлено"
fi

if [ -z "$TELEGRAM_ADMIN_ID" ]; then
    log_warning "TELEGRAM_ADMIN_ID не встановлено"
    echo ""
    read -p "Введи свій Telegram ID (або Enter для пропуску): " ADMIN_ID
    if [ -n "$ADMIN_ID" ]; then
        export TELEGRAM_ADMIN_ID="$ADMIN_ID"
        log_success "Admin ID встановлено"
    fi
else
    log_success "TELEGRAM_ADMIN_ID встановлено"
fi

# Встановлюємо Redis URL якщо немає
export REDIS_URL="${REDIS_URL:-redis://localhost:6379/1}"

echo ""

# ==================== КРОК 6: ВИБІР РЕЖИМУ ====================

log_info "Крок 6/7: Вибір режиму запуску..."
echo ""

echo "Оберіть що запустити:"
echo "  1) Тільки Telegram Bot (контроль через Telegram)"
echo "  2) Повна система (Orchestrator + Bot + UI Guardian + Auto-repair)"
echo "  3) Тільки UI Guardian (тестування та звіт)"
echo "  4) Діагностика (перевірка без запуску)"
echo "  5) Скасувати"
echo ""

read -p "Ваш вибір [1-5]: " MODE

case $MODE in
    1)
        echo ""
        log_info "Запуск Telegram Bot..."
        echo ""
        log_success "Bot запущений! Іди в Telegram → /start"
        echo ""
        python3 backend/orchestrator/agents/telegram_bot_v2.py
        ;;

    2)
        echo ""
        log_info "Запуск ПОВНОЇ СИСТЕМИ..."
        echo ""
        log_info "Що запускається:"
        echo "  • Autonomous Orchestrator"
        echo "  • UI Guardian (кожні 2 сек)"
        echo "  • Power Monitor (heartbeat)"
        echo "  • Self-Healing"
        echo "  • Code Improver"
        echo "  • LLM Council"
        if [ -n "$TELEGRAM_BOT_TOKEN" ]; then
            echo "  • Telegram notifications"
        fi
        echo ""
        log_warning "ВАЖЛИВО: Approvals будуть в Telegram!"
        echo ""
        sleep 3

        python3 backend/orchestrator/main.py
        ;;

    3)
        echo ""
        log_info "Запуск UI Guardian (тест)..."
        echo ""

        python3 << 'EOF'
import asyncio
import sys
sys.path.insert(0, '/Users/dima-mac/Documents/Predator_21')

from backend.orchestrator.tasks.ui_guardian import UIGuardian

async def test():
    print("🔍 UI Guardian Test...")
    print("")

    guardian = UIGuardian()
    guardian.base_url = "http://localhost:3000"

    result = await guardian.check_ui()

    print("")
    print("=" * 50)
    print("РЕЗУЛЬТАТ:")
    print("=" * 50)
    print(f"Status: {result.get('status')}")
    print(f"Pages checked: {result.get('pages_checked')}")
    print(f"Pages failed: {result.get('pages_failed')}")
    print(f"Total elements: {result.get('total_elements')}")
    print(f"Suggestions: {result.get('suggestions_count')}")
    print("")

asyncio.run(test())
EOF
        ;;

    4)
        echo ""
        log_info "Запуск діагностики..."
        echo ""
        ./scripts/diagnose_ui.sh
        ;;

    5)
        echo ""
        log_info "Скасовано"
        exit 0
        ;;

    *)
        log_error "Невірний вибір!"
        exit 1
        ;;
esac

# ==================== КРОК 7: POST-LAUNCH ====================

echo ""
log_success "Система запущена!"
echo ""

# Показуємо корисні команди
log_info "Корисні команди:"
echo ""
echo "  Перевірити контейнери:  docker ps"
echo "  Логи backend:            docker logs predator_backend"
echo "  Логи orchestrator:       tail -f /app/orchestrator/system.log"
echo "  Зупинити все:            docker compose down"
echo ""

if [ -n "$TELEGRAM_BOT_TOKEN" ]; then
    log_info "📱 Telegram Bot доступний - напиши /start своєму боту!"
fi

echo ""
log_success "Насолоджуйся! 🚀"
