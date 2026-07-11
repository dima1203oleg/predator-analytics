#!/bin/bash

# Скрипт для очищення диска на Mac

LOG_FILE="/Users/Shared/Predator_60/logs/clean_disk.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

log "Початок очищення диска..."

# Очищення кешу системи
log "Очищення кешу системи..."
sudo rm -rf ~/Library/Caches/* 2>> "$LOG_FILE"
sudo rm -rf /Library/Caches/* 2>> "$LOG_FILE"

# Очищення кошика
log "Очищення кошика..."
rm -rf ~/.Trash/* 2>> "$LOG_FILE"

# Очищення логів та звітів про збої
log "Очищення логів та звітів про збої..."
sudo rm -rf /Library/Logs/* 2>> "$LOG_FILE"
sudo rm -rf ~/Library/Logs/* 2>> "$LOG_FILE"
sudo rm -rf /private/var/log/* 2>> "$LOG_FILE"

# Очищення кешу Docker (якщо встановлений)
if command -v docker &> /dev/null; then
    log "Очищення кешу Docker..."
    docker system prune -af 2>> "$LOG_FILE"
fi

# Очищення тимчасових файлів
log "Очищення тимчасових файлів..."
sudo rm -rf /tmp/* 2>> "$LOG_FILE"
sudo rm -rf /private/tmp/* 2>> "$LOG_FILE"

# Очищення кешу Python
log "Очищення кешу Python..."
find ~/.cache/pip -type f -delete 2>> "$LOG_FILE"

log "Очищення диска завершено."