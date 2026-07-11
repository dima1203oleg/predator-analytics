#!/bin/bash

# Скрипт для відновлення роботи PTY

LOG_FILE="/Users/Shared/Predator_60/logs/fix_pty.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Перевірка кількості доступних PTY
log "Перевірка кількості доступних PTY..."
PTY_COUNT=$(sysctl -n kern.tty.ptmx_max 2>> "$LOG_FILE")
log "Максимальна кількість PTY: $PTY_COUNT"

# Зупинка непотрібних процесів
log "Зупинка непотрібних процесів..."
pkill -f "google_antigravity" 2>> "$LOG_FILE"
pkill -f "mega_agent" 2>> "$LOG_FILE"
pkill -f "watchdog" 2>> "$LOG_FILE"

# Перезапуск Docker (якщо запущений)
if command -v docker &> /dev/null; then
    log "Перезапуск Docker..."
    sudo systemctl restart docker 2>> "$LOG_FILE"
fi

# Перезапуск VS Code (якщо запущений)
if pgrep -f "Visual Studio Code" &> /dev/null; then
    log "Перезапуск VS Code..."
    pkill -f "Visual Studio Code" 2>> "$LOG_FILE"
    sleep 2
    open -a "Visual Studio Code" 2>> "$LOG_FILE"
fi

# Перезапуск терміналу
log "Перезапуск терміналу..."
osascript -e 'tell application "Terminal" to quit' 2>> "$LOG_FILE"
sleep 2
open -a Terminal 2>> "$LOG_FILE"

# Додаткові дії для усунення помилки posix_spawnp failed
log "Перевірка та видалення зомбі-процесів..."
pkill -9 -f "defunct" 2>> "$LOG_FILE"

log "Скрипт завершено. Спробуйте знову відкрити термінал."