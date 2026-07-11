#!/bin/bash

# Скрипт для запуску KLAV-Agent

LOG_FILE="/Users/Shared/Predator_60/logs/run_klav_agent.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Запуск KLAV-Agent
log "Запуск KLAV-Agent..."

# Приклад команди для запуску KLAV-Agent (замініть на фактичну команду)
# Запуск через Telegram-бот або напряму на сервері
# ssh dima@192.168.1.48 "python3 /path/to/klav_agent.py"

log "KLAV-Agent запущено."