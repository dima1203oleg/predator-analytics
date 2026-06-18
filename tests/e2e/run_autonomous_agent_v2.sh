#!/bin/bash

###############################################################################
# 🦅 Autonomous Agent v2.0 - Launcher Script
# PREDATOR Analytics v61.0-ELITE
#
# Запуск автономної системи E2E-тестування з самодіагностикою та самовідновленням
###############################################################################

set -e  # Зупинка при помилках

# Кольори для виводу
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Конфігурація
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
LOG_DIR="$SCRIPT_DIR/logs"
REPORT_DIR="$SCRIPT_DIR/reports"

# Створення директорій
mkdir -p "$LOG_DIR"
mkdir -p "$REPORT_DIR"

# Перемінні середовища
export NVIDIA_SERVER="${NVIDIA_SERVER:-predator-server}"
export NVIDIA_HOST="${NVIDIA_HOST:-194.177.1.200}"
export NVIDIA_USER="${NVIDIA_USER:-predator}"
export UI_URL="${UI_URL:-http://localhost:3030}"
export BACKEND_URL="${BACKEND_URL:-http://localhost:8000}"
export TEST_FILE_PATH="${TEST_FILE_PATH:-/Users/dima1203/Desktop/Березень_2024_repacked.xlsx}"
export MAX_ITERATIONS="${MAX_ITERATIONS:-10}"
export BACKEND_MODE="${BACKEND_MODE:-auto}"
export ENABLE_LLM_DIAGNOSTICS="${ENABLE_LLM_DIAGNOSTICS:-true}"

###############################################################################
# Функції
###############################################################################

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_banner() {
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║        🦅 Autonomous Agent v2.0 - PREDATOR Analytics           ║"
    echo "║              E2E Testing with Self-Healing                    ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

check_dependencies() {
    log_info "Перевірка залежностей..."
    
    # Python 3.12
    if ! command -v python3 &> /dev/null; then
        log_error "Python 3 не знайдено"
        exit 1
    fi
    
    # Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js не знайдено"
        exit 1
    fi
    
    # Playwright
    if ! command -v npx &> /dev/null; then
        log_error "npx не знайдено"
        exit 1
    fi
    
    # SSH
    if ! command -v ssh &> /dev/null; then
        log_error "SSH не знайдено"
        exit 1
    fi
    
    log_success "Всі залежності встановлені"
}

check_ssh_connection() {
    log_info "Перевірка SSH з'єднання з NVIDIA сервером..."
    
    if ssh -o ConnectTimeout=10 "$NVIDIA_SERVER" echo "Connection successful" &> /dev/null; then
        log_success "SSH з'єднання встановлено"
        return 0
    else
        log_warning "SSH з'єднання не вдалося. Продовжуємо в локальному режимі..."
        export BACKEND_MODE="local"
        return 1
    fi
}

check_test_file() {
    log_info "Перевірка тестового файлу..."
    
    if [ -f "$TEST_FILE_PATH" ]; then
        file_size=$(du -h "$TEST_FILE_PATH" | cut -f1)
        log_success "Файл знайдено: $TEST_FILE_PATH ($file_size)"
        return 0
    else
        log_error "Файл не знайдено: $TEST_FILE_PATH"
        return 1
    fi
}

check_ui_running() {
    log_info "Перевірка статусу UI..."
    
    if curl -s -o /dev/null -w "%{http_code}" "$UI_URL" | grep -q "200\|302"; then
        log_success "UI доступний: $UI_URL"
        return 0
    else
        log_warning "UI недоступний. Спроба запуску..."
        
        # Запуск UI з автономним режимом
        cd "$PROJECT_ROOT/apps/predator-analytics-ui"
        VITE_AUTO_MODE=true npm run dev > "$LOG_DIR/ui.log" 2>&1 &
        UI_PID=$!
        
        # Очікування запуску
        for i in {1..30}; do
            if curl -s -o /dev/null -w "%{http_code}" "$UI_URL" | grep -q "200\|302"; then
                log_success "UI запущено (PID: $UI_PID)"
                echo "$UI_PID" > "$LOG_DIR/ui.pid"
                return 0
            fi
            sleep 2
        done
        
        log_error "Не вдалося запустити UI"
        return 1
    fi
}

run_master_orchestrator() {
    log_info "Запуск Master Orchestrator..."
    
    cd "$SCRIPT_DIR"
    
    # Запуск Python orchestrator
    python3 master_orchestrator.py 2>&1 | tee "$LOG_DIR/orchestrator.log"
    
    ORCHESTRATOR_EXIT_CODE=${PIPESTATUS[0]}
    
    if [ $ORCHESTRATOR_EXIT_CODE -eq 0 ]; then
        log_success "Master Orchestrator завершився успішно"
    else
        log_error "Master Orchestrator завершився з помилкою (код: $ORCHESTRATOR_EXIT_CODE)"
    fi
    
    return $ORCHESTRATOR_EXIT_CODE
}

cleanup() {
    log_info "Очищення ресурсів..."
    
    # Зупинка UI якщо було запущено
    if [ -f "$LOG_DIR/ui.pid" ]; then
        UI_PID=$(cat "$LOG_DIR/ui.pid")
        if ps -p $UI_PID > /dev/null; then
            log_info "Зупинка UI (PID: $UI_PID)..."
            kill $UI_PID
            rm "$LOG_DIR/ui.pid"
        fi
    fi
    
    log_success "Очищення завершено"
}

show_report() {
    log_info "Показ останнього звіту..."
    
    LATEST_REPORT=$(ls -t "$REPORT_DIR"/autonomous_agent_report_*.json 2>/dev/null | head -1)
    
    if [ -f "$LATEST_REPORT" ]; then
        log_success "Останній звіт: $LATEST_REPORT"
        
        # Вивід фінального статусу
        FINAL_STATUS=$(python3 -c "import json; print(json.load(open('$LATEST_REPORT'))['final_status'])")
        echo -e "${BLUE}Фінальний статус: ${NC}$FINAL_STATUS"
        
        # Відкриття звіту в браузері
        if command -v open &> /dev/null; then
            LATEST_MD=$(ls -t "$REPORT_DIR"/autonomous_agent_report_*.md 2>/dev/null | head -1)
            if [ -f "$LATEST_MD" ]; then
                log_info "Відкриття звіту в браузері..."
                open "$LATEST_MD"
            fi
        fi
    else
        log_warning "Звіти не знайдено"
    fi
}

###############################################################################
# Головний виконавчий блок
###############################################################################

# Обробка сигналів
trap cleanup EXIT INT TERM

# Вивід банера
print_banner

# Перевірка залежностей
check_dependencies

# Перевірка SSH з'єднання
check_ssh_connection

# Перевірка тестового файлу
check_test_file || {
    log_warning "Продовжуємо без тестового файлу..."
}

# Перевірка UI
check_ui_running

# Запуск Master Orchestrator
log_info "Початок виконання автономного агента..."
echo ""

run_master_orchestrator
ORCHESTRATOR_RESULT=$?

echo ""

# Показ звіту
show_report

# Фінальний статус
if [ $ORCHESTRATOR_RESULT -eq 0 ]; then
    log_success "Автономний агент завершився успішно"
    exit 0
else
    log_error "Автономний агент завершився з помилками"
    exit 1
fi
