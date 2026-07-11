#!/bin/bash

# Скрипт для перевірки стану мега-агента та його перезапуску у разі зупинки

LOG_FILE="/Users/Shared/Predator_60/logs/check_mega_agent.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Перевірка стану мега-агента
if ! pgrep -f "mega_agent" > /dev/null; then
    log "Мега-агент не запущений. Перезапускаємо..."
    nohup bash /Users/Shared/Predator_60/scripts/run_mega_agent.sh >> "$LOG_FILE" 2>&1 &
else
    log "Мега-агент запущений."
fi

log "Перевірка завершена."