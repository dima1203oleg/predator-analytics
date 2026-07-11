#!/bin/bash

# 🔄 Switch Model on Idle — Зміна моделі при зависанні
# Якщо протягом 15 секунд немає змін, скрипт змінює модель на більш підходящу.

set -euo pipefail

LOG_DIR="/Users/Shared/Predator_60/logs"
LOG_FILE="$LOG_DIR/switch_model_on_idle.log"
TENNIS_CHANNEL="/Users/Shared/Predator_60/agent_tennis_channel.md"
MODEL_FILE="/Users/Shared/Predator_60/current_model.txt"

mkdir -p "$LOG_DIR"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

# Список доступних моделей
MODELS=(
    "gpt-4o"
    "gpt-4-turbo"
    "claude-3-opus"
    "gemini-1.5-pro"
    "llama-3-70b"
    "qwen-2-72b"
)

# Вибір наступної моделі
switch_model() {
    local current_model
    if [ -f "$MODEL_FILE" ]; then
        current_model=$(cat "$MODEL_FILE")
    else
        current_model=""
    fi
    
    for i in "${!MODELS[@]}"; do
        if [[ "${MODELS[$i]}" == "$current_model" ]]; then
            next_model="${MODELS[$(( (i + 1) % ${#MODELS[@]} ))]}"
            echo "$next_model" > "$MODEL_FILE"
            log "🔄 Змінено модель з $current_model на $next_model"
            return
        fi
    done
    
    # Якщо модель не знайдено, вибираємо першу
    echo "${MODELS[0]}" > "$MODEL_FILE"
    log "🔄 Вибрано модель за замовчуванням: ${MODELS[0]}"
}

# Перевірка активності у каналі зв'язку
check_activity() {
    local last_activity
    last_activity=$(stat -f "%m" "$TENNIS_CHANNEL")
    local current_time
    current_time=$(date +%s)
    local time_diff
    time_diff=$((current_time - last_activity))

    if [ $time_diff -gt 180 ]; then
        log "⚠️ Немає активності протягом 180 секунд. Змінюю модель..."
        switch_model
        
        # Додаю повідомлення у канал зв'язку
        echo "### [ACTION_REQUIRED] $(date +'%Y%m%d-%H%M%S')
**Від:** Watchdog
**Дата:** $(date +'%Y-%m-%d %H:%M:%S')
**Статус:** Виконано
**Завдання:** Зміна моделі через зависання.
**Результат:** Модель змінено на $(cat "$MODEL_FILE").
**Наступні кроки:** Mega Agent, продовжуй роботу з новою моделлю." >> "$TENNIS_CHANNEL"
    else
        log "✅ Активність є. Модель не змінено."
    fi
}

# Головний цикл
main() {
    log "🚀 Запуск моніторингу активності та зміни моделі..."
    while true; do
        check_activity
        sleep 5
    done
}

main