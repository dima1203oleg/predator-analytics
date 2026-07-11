#!/bin/bash

# 🔥 Mega Agent — Безперервний запуск
# Цей скрипт гарантує, що Mega Agent НІКОЛИ не зупиниться.

set -euo pipefail

LOG_DIR="/Users/Shared/Predator_60/logs"
LOG_FILE="$LOG_DIR/mega_agent_forever.log"
mkdir -p "$LOG_DIR"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

# Перевірка, чи запущено вже агент
if pgrep -f "python3.*main.py" > /dev/null; then
    log "✅ Mega Agent вже запущено. PID: $(pgrep -f "python3.*main.py")"
    exit 0
fi

# Безперервний запуск
while true; do
    log "🚀 Запуск Mega Agent..."
    cd /Users/dima1203/Documents/dual-agent-runtime/
    python3 main.py >> "$LOG_FILE" 2>&1
    
    EXIT_CODE=$?
    if [ $EXIT_CODE -ne 0 ]; then
        log "❌ Mega Agent завершився з помилкою (код: $EXIT_CODE). Перезапуск через 5 секунд..."
    else
        log "✅ Mega Agent завершився успішно. Перезапуск через 5 секунд..."
    fi
    
    sleep 5
    log "🔄 Перезапуск Mega Agent..."
done