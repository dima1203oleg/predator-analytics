#!/bin/bash

# Скрипт для автоматичного перезапуску терміналу у разі зависання

LOG_FILE="/Users/Shared/Predator_60/logs/restart_terminal.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Перевірка, чи термінал відповідає
if ! pgrep -f "Terminal" > /dev/null; then
    log "Термінал не відповідає. Перезапускаємо..."
    osascript -e 'tell application "Terminal" to quit' 2>> "$LOG_FILE"
    sleep 2
    open -a Terminal 2>> "$LOG_FILE"
else
    log "Термінал працює нормально."
fi

log "Перевірка завершена."