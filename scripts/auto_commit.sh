#!/bin/bash

# Скрипт для автоматичного коміту та пушу

LOG_FILE="/Users/Shared/Predator_60/logs/auto_commit.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Переходимо до директорії проекту
cd /Users/Shared/Predator_60 || { log "Помилка: Не вдалося перейти до директорії проекту"; exit 1; }

# Додаємо всі зміни до коміту
log "Додаємо всі зміни до коміту..."
git add . 2>> "$LOG_FILE"

# Виконуємо коміт
log "Виконуємо коміт..."
git commit -m "feat: автоматичний коміт та пуш" 2>> "$LOG_FILE"

# Виконуємо пуш
log "Виконуємо пуш..."
git push origin main 2>> "$LOG_FILE"

log "Коміт та пуш завершено."