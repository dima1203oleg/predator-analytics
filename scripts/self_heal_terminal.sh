#!/bin/bash

# Скрипт для автоматичного відновлення роботи терміналу та запуску сторожового демона

LOG_FILE="/Users/Shared/Predator_60/logs/self_heal.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Спроба перезапустити Terminal через osascript
log "Спроба перезапустити Terminal через osascript..."
osascript -e 'tell application "Terminal" to quit' 2>> "$LOG_FILE"
sleep 2
open -a Terminal 2>> "$LOG_FILE"
log "Terminal перезапущено."

# Надання прав на виконання скриптів
log "Надання прав на виконання скриптів..."
chmod +x /Users/Shared/Predator_60/scripts/watchdog_mega_agent.sh 2>> "$LOG_FILE"
chmod +x /Users/Shared/Predator_60/scripts/run_mega_agent.sh 2>> "$LOG_FILE"
chmod +x /Users/Shared/Predator_60/scripts/set_permissions.sh 2>> "$LOG_FILE"
log "Права на виконання надано."

# Запуск сторожового демона
log "Запуск сторожового демона..."
nohup bash /Users/Shared/Predator_60/scripts/watchdog_mega_agent.sh >> "$LOG_FILE" 2>&1 &
log "Сторожовий демон запущено."

# Перевірка стану мега-агента
log "Перевірка стану мега-агента..."
if pgrep -f "mega_agent" > /dev/null; then
    log "Мега-агент запущений."
else
    log "Мега-агент не запущений. Сторожовий демон перезапустить його автоматично."
fi

log "Скрипт саморемонту завершено."