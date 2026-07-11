#!/bin/bash

# 🔍 Monitor Agent Activity — Автоматична реакція на зависання
# Якщо не видно змін у роботі агентів, скрипт ініціює дію.

set -euo pipefail

LOG_DIR="/Users/Shared/Predator_60/logs"
LOG_FILE="$LOG_DIR/monitor_agent_activity.log"
TENNIS_CHANNEL="/Users/Shared/Predator_60/agent_tennis_channel.md"

mkdir -p "$LOG_DIR"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

# Перевірка останньої активності в каналі зв'язку
check_tennis_channel_activity() {
    local last_activity
    last_activity=$(stat -f "%m" "$TENNIS_CHANNEL")
    local current_time
    current_time=$(date +%s)
    local time_diff
    time_diff=$((current_time - last_activity))

    if [ $time_diff -gt 300 ]; then
        log "⚠️ Канал зв'язку неактивний більше 5 хвилин. Ініціюю дію..."
        echo "### [ACTION_REQUIRED] $(date +'%Y%m%d-%H%M%S')
**Від:** Monitor
**Дата:** $(date +'%Y-%m-%d %H:%M:%S')
**Статус:** Очікує дії
**Завдання:** Перевірка активності агентів.
**Результат:** Канал зв'язку неактивний.
**Наступні кроки:** Mega Agent, перевір статус." >> "$TENNIS_CHANNEL"
    else
        log "✅ Канал зв'язку активний. Остання активність: $time_diff секунд тому."
    fi
}

# Перевірка активності Mega Agent
check_mega_agent_activity() {
    if ! pgrep -f "python3.*main.py" > /dev/null; then
        log "❌ Mega Agent не запущено. Перезапускаю..."
        cd /Users/dima1203/Documents/dual-agent-runtime/ && nohup /Users/dima1203/.local/bin/python3.12 main.py > "$LOG_DIR/mega_agent.log" 2>&1 &
        log "✅ Mega Agent перезапущено."
    else
        log "✅ Mega Agent працює."
    fi
}

# Головний цикл
main() {
    log "🚀 Запуск моніторингу активності агентів..."
    while true; do
        check_tennis_channel_activity
        check_mega_agent_activity
        sleep 60
    done
}

main