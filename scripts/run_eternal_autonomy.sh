#!/bin/bash
# ============================================================================
# 🤖 PREDATOR ETERNAL AUTONOMY SUPERVISOR
# ============================================================================
# Запускає та підтримує автономний процесор в режимі 24/7.
# Перезапускає при збоях, зберігає логи, моніторить здоров'я.
#
# Використання:
#   ./run_eternal_autonomy.sh start   - Запустити демон
#   ./run_eternal_autonomy.sh stop    - Зупинити демон
#   ./run_eternal_autonomy.sh status  - Перевірити статус
#   ./run_eternal_autonomy.sh logs    - Показати логи
# ============================================================================

set -e

# Конфігурація
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PROCESSOR_SCRIPT="$SCRIPT_DIR/eternal_autonomous_processor.py"
PID_FILE="$PROJECT_ROOT/.azr/eternal_processor.pid"
LOG_FILE="$PROJECT_ROOT/logs/eternal_processor.log"
PYTHON_CMD="${PYTHON_CMD:-python3}"

# Кольори для виводу
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Створення директорій
mkdir -p "$PROJECT_ROOT/.azr"
mkdir -p "$PROJECT_ROOT/logs"
mkdir -p "$PROJECT_ROOT/metrics/eternal_processor"

# Функції
print_banner() {
    echo -e "${PURPLE}"
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║                                                               ║"
    echo "║   ♾️  PREDATOR ETERNAL AUTONOMY SUPERVISOR                   ║"
    echo "║                                                               ║"
    echo "║   🔴 РЕЖИМ: 24/7 БЕЗ УЧАСТІ ЛЮДИНИ                          ║"
    echo "║   🔴 ПЕРЕЗАПУСК: АВТОМАТИЧНИЙ                                ║"
    echo "║   🔴 МОНІТОРИНГ: БЕЗПЕРЕРВНИЙ                                ║"
    echo "║                                                               ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

log() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    case $level in
        "INFO")  echo -e "${GREEN}[$timestamp] [INFO] $message${NC}" ;;
        "WARN")  echo -e "${YELLOW}[$timestamp] [WARN] $message${NC}" ;;
        "ERROR") echo -e "${RED}[$timestamp] [ERROR] $message${NC}" ;;
        "DEBUG") echo -e "${BLUE}[$timestamp] [DEBUG] $message${NC}" ;;
    esac

    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
}

get_pid() {
    if [ -f "$PID_FILE" ]; then
        cat "$PID_FILE"
    else
        echo ""
    fi
}

is_running() {
    local pid=$(get_pid)
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
        return 0
    else
        return 1
    fi
}

start_daemon() {
    print_banner

    if is_running; then
        local pid=$(get_pid)
        log "WARN" "Процесор вже запущено (PID: $pid)"
        return 1
    fi

    log "INFO" "Запуск Eternal Autonomous Processor..."

    # Перевірка Python
    if ! command -v $PYTHON_CMD &> /dev/null; then
        log "ERROR" "Python не знайдено: $PYTHON_CMD"
        return 1
    fi

    # Перевірка скрипта
    if [ ! -f "$PROCESSOR_SCRIPT" ]; then
        log "ERROR" "Скрипт не знайдено: $PROCESSOR_SCRIPT"
        return 1
    fi

    # Запуск у фоновому режимі з автоматичним перезапуском
    (
        while true; do
            log "INFO" "Запуск процесора..."

            cd "$PROJECT_ROOT"

            # Запуск з перенаправленням виводу
            $PYTHON_CMD "$PROCESSOR_SCRIPT" >> "$LOG_FILE" 2>&1
            EXIT_CODE=$?

            log "WARN" "Процесор завершився з кодом $EXIT_CODE"

            # Перевірка на навмисне завершення
            if [ ! -f "$PID_FILE" ]; then
                log "INFO" "PID файл видалено. Завершення supervisor."
                break
            fi

            # Пауза перед перезапуском
            log "INFO" "Перезапуск через 10 секунд..."
            sleep 10
        done
    ) &

    local daemon_pid=$!
    echo $daemon_pid > "$PID_FILE"

    sleep 2

    if is_running; then
        log "INFO" "✅ Процесор успішно запущено (PID: $daemon_pid)"
        log "INFO" "📝 Логи: $LOG_FILE"
        log "INFO" "📊 Метрики: $PROJECT_ROOT/metrics/eternal_processor/"
    else
        log "ERROR" "❌ Не вдалося запустити процесор"
        rm -f "$PID_FILE"
        return 1
    fi
}

stop_daemon() {
    print_banner

    if ! is_running; then
        log "WARN" "Процесор не запущено"
        rm -f "$PID_FILE"
        return 0
    fi

    local pid=$(get_pid)
    log "INFO" "Зупинка процесора (PID: $pid)..."

    # Спочатку м'яке завершення
    kill -TERM "$pid" 2>/dev/null

    # Очікування завершення
    for i in {1..30}; do
        if ! is_running; then
            break
        fi
        sleep 1
    done

    # Якщо ще працює - примусове завершення
    if is_running; then
        log "WARN" "Примусове завершення..."
        kill -9 "$pid" 2>/dev/null
    fi

    rm -f "$PID_FILE"
    log "INFO" "✅ Процесор зупинено"
}

status_daemon() {
    print_banner

    if is_running; then
        local pid=$(get_pid)
        echo -e "${GREEN}━━━ СТАТУС: АКТИВНИЙ ━━━${NC}"
        echo ""
        echo -e "  ${BLUE}PID:${NC} $pid"

        # Час роботи
        local start_time=$(ps -o lstart= -p $pid 2>/dev/null | xargs)
        if [ -n "$start_time" ]; then
            echo -e "  ${BLUE}Запущено:${NC} $start_time"
        fi

        # Використання ресурсів
        local cpu=$(ps -o %cpu= -p $pid 2>/dev/null | xargs)
        local mem=$(ps -o %mem= -p $pid 2>/dev/null | xargs)
        echo -e "  ${BLUE}CPU:${NC} ${cpu:-N/A}%"
        echo -e "  ${BLUE}MEM:${NC} ${mem:-N/A}%"

        # Останні метрики
        local latest_metrics=$(ls -t "$PROJECT_ROOT/metrics/eternal_processor/"*.jsonl 2>/dev/null | head -1)
        if [ -n "$latest_metrics" ]; then
            echo ""
            echo -e "  ${BLUE}Останні метрики:${NC}"
            tail -1 "$latest_metrics" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    print(f\"    Цикл: {data.get('cycle', 'N/A')}\")
    print(f\"    Uptime: {data.get('uptime_hours', 0):.2f} годин\")
    stats = data.get('stats', {})
    print(f\"    Успішних: {stats.get('successful_cycles', 0)}\")
    print(f\"    Провалених: {stats.get('failed_cycles', 0)}\")
    print(f\"    Відновлено: {stats.get('healed_errors', 0)}\")
except:
    pass
" 2>/dev/null
        fi

        echo ""
        echo -e "  ${BLUE}Логи:${NC} $LOG_FILE"
        echo ""

    else
        echo -e "${RED}━━━ СТАТУС: НЕАКТИВНИЙ ━━━${NC}"
        echo ""
        echo "Процесор не запущено."
        echo ""
        echo "Для запуску виконайте:"
        echo "  $0 start"
        echo ""
    fi
}

show_logs() {
    print_banner

    if [ -f "$LOG_FILE" ]; then
        echo -e "${BLUE}━━━ ОСТАННІ ЛОГИ ━━━${NC}"
        echo ""
        tail -100 "$LOG_FILE"
    else
        log "WARN" "Файл логів не знайдено: $LOG_FILE"
    fi
}

follow_logs() {
    print_banner

    if [ -f "$LOG_FILE" ]; then
        echo -e "${BLUE}━━━ LIVE LOGS (Ctrl+C для виходу) ━━━${NC}"
        echo ""
        tail -f "$LOG_FILE"
    else
        log "WARN" "Файл логів не знайдено: $LOG_FILE"
    fi
}

restart_daemon() {
    print_banner
    log "INFO" "Перезапуск процесора..."
    stop_daemon
    sleep 2
    start_daemon
}

# Головна логіка
case "${1:-}" in
    start)
        start_daemon
        ;;
    stop)
        stop_daemon
        ;;
    restart)
        restart_daemon
        ;;
    status)
        status_daemon
        ;;
    logs)
        show_logs
        ;;
    follow)
        follow_logs
        ;;
    *)
        print_banner
        echo "Використання: $0 {start|stop|restart|status|logs|follow}"
        echo ""
        echo "Команди:"
        echo "  start   - Запустити демон автономності"
        echo "  stop    - Зупинити демон"
        echo "  restart - Перезапустити демон"
        echo "  status  - Показати статус"
        echo "  logs    - Показати останні логи"
        echo "  follow  - Слідкувати за логами в реальному часі"
        echo ""
        exit 1
        ;;
esac
