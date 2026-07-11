#!/bin/bash

# Назва процесу мега-агента (замініть на фактичну назву)
PROCESS_NAME="mega_agent"

# Шлях до скрипта, який запускає мега-агент (замініть на фактичний)
AGENT_SCRIPT="/Users/Shared/Predator_60/scripts/run_mega_agent.sh"

# Лог-файл для сторожового демона
LOG_FILE="/Users/Shared/Predator_60/logs/watchdog_mega_agent.log"

# Інтервал перевірки у секундах
INTERVAL=5

# Функція для логування
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Перевірка, чи запущений процес
is_process_running() {
    pgrep -f "$PROCESS_NAME" > /dev/null
}

# Запуск мега-агента
start_agent() {
    log "Запускаємо мега-агент: $AGENT_SCRIPT"
    nohup bash "$AGENT_SCRIPT" >> "$LOG_FILE" 2>&1 &
}

# Головний цикл сторожового демона
log "Сторожовий демон мега-агента запущено. Інтервал перевірки: $INTERVAL секунд."

while true; do
    if ! is_process_running; then
        log "Процес мега-агента не знайдено. Перезапускаємо..."
        start_agent
    fi
    sleep "$INTERVAL"
done