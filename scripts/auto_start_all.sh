#!/bin/bash

# Скрипт для автоматичного запуску всіх захисних механізмів

LOG_FILE="/Users/Shared/Predator_60/logs/auto_start_all.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Надання прав на виконання всіх скриптів
log "Надання прав на виконання скриптів..."
chmod +x /Users/Shared/Predator_60/scripts/*.sh 2>> "$LOG_FILE"
chmod +x /Users/Shared/Predator_60/scripts/*.py 2>> "$LOG_FILE"
chmod +x /Users/Shared/Predator_60/scripts/run_klav_agent.sh 2>> "$LOG_FILE"

# Запуск сторожового демона для мега-агента
log "Запуск сторожового демона для мега-агента..."
nohup bash /Users/Shared/Predator_60/scripts/watchdog_mega_agent.sh >> /Users/Shared/Predator_60/logs/watchdog_mega_agent.log 2>&1 &
nohup python3 /Users/Shared/Predator_60/scripts/watchdog_mega_agent.py >> /Users/Shared/Predator_60/logs/watchdog_mega_agent_python.log 2>&1 &

# Запуск моніторингу ресурсів
log "Запуск моніторингу ресурсів..."
bash /Users/Shared/Predator_60/scripts/monitor_resources.sh

# Запуск перевірки мега-агента
log "Запуск перевірки мега-агента..."
bash /Users/Shared/Predator_60/scripts/check_mega_agent.sh

# Запуск перезапуску терміналу
log "Запуск перезапуску терміналу..."
bash /Users/Shared/Predator_60/scripts/restart_terminal.sh

log "Автоматичний запуск всіх компонентів завершено."