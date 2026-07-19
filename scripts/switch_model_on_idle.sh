#!/bin/bash

# 🔄 Switch Model on Idle — Зміна моделі при зависанні
# Якщо протягом 15 секунд немає змін, скрипт змінює модель на більш підходящу.

set -euo pipefail

# --- Конфігурація ---
SCRIPT_DIR=$(dirname "$0")
CONFIG_FILE="${SCRIPT_DIR}/../conf/switch_model_on_idle.conf"

# Завантаження конфігурації
if [ -f "$CONFIG_FILE" ]; then
    # shellcheck source=/dev/null
    source "$CONFIG_FILE"
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 🛑 Конфігураційний файл не знайдено: $CONFIG_FILE"
    exit 1
fi

LOG_FILE="$LOG_DIR/switch_model_on_idle.log"
PID_FILE="$LOG_DIR/$(basename "$0").pid"

mkdir -p "$LOG_DIR"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

# Повідомлення про зміну моделі у канал зв'язку
post_switch_notification() {
    # Перевірка файлу для вимкнення сповіщень
    if [ -f "$NOTIFICATION_MUTE_FILE" ]; then
        log "🔕 Сповіщення в tennis_channel вимкнено через наявність mute-файлу."
        return
    fi

    local new_model
    new_model=$(cat "$MODEL_FILE")
    local timestamp
    timestamp=$(date +'%Y-%m-%d %H:%M:%S')

    # Використання here document для кращої читабельності
    cat >> "$TENNIS_CHANNEL" << EOM
### [ACTION_REQUIRED] $(date +'%Y%m%d-%H%M%S')
**Від:** Watchdog
**Дата:** $timestamp
**Статус:** Виконано
**Завдання:** Зміна моделі через зависання.
**Результат:** Модель змінено на $new_model.
**Наступні кроки:** Mega Agent, продовжуй роботу з новою моделлю.
EOM
}

# Сповіщення в Telegram про зміну моделі
send_telegram_notification() {
    local old_model="$1"
    local new_model="$2"

    # Перевірка файлу для вимкнення сповіщень
    if [ -f "$NOTIFICATION_MUTE_FILE" ]; then
        log "🔕 Сповіщення в Telegram вимкнено через наявність mute-файлу."
        return
    fi

    # Перевірка, чи задані токен і ID чату в конфігурації
    if [ -z "${TELEGRAM_BOT_TOKEN:-}" ] || [ -z "${TELEGRAM_CHAT_ID:-}" ]; then
        log "🟡 TELEGRAM_BOT_TOKEN або TELEGRAM_CHAT_ID не налаштовано. Пропускаю сповіщення в Telegram."
        return
    fi

    # Формування повідомлення (HTML)
    local text
    text=$(cat <<EOF
🔄 <b>Model Switch Alert</b> 🔄

Watchdog changed model due to <code>$IDLE_TIMEOUT</code> seconds of inactivity.

<b>Old Model:</b> <code>${old_model:-N/A}</code>
<b>New Model:</b> <code>$new_model</code>
EOF
)

    # Асинхронна відправка через curl, щоб не блокувати цикл
    curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
        --data-urlencode "chat_id=${TELEGRAM_CHAT_ID}" \
        --data-urlencode "text=${text}" \
        --data-urlencode "parse_mode=HTML" > /dev/null &
    
    log "✅ Спроба надіслати сповіщення в Telegram..."
}

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
            log "🔄 Змінено модель з '$current_model' на '$next_model'"
            send_telegram_notification "$current_model" "$next_model"
            return
        fi
    done
    
    # Якщо модель не знайдено, вибираємо першу
    local next_model="${MODELS[0]}"
    echo "$next_model" > "$MODEL_FILE"
    log "🔄 Встановлено модель за замовчуванням: '$next_model'"
    send_telegram_notification "$current_model" "$next_model"
}

# Головний цикл
main() {
    # Перевірка наявності fswatch
    if ! command -v fswatch &> /dev/null; then
        log "🛑 fswatch не знайдено. Будь ласка, встановіть його (наприклад, 'brew install fswatch' на macOS). Виходжу."
        exit 1
    fi

    # Перевірка наявності іншого екземпляра скрипта
    if [ -f "$PID_FILE" ] && ps -p "$(cat "$PID_FILE")" > /dev/null; then
        log "🛑 Інший екземпляр скрипта вже запущено. PID: $(cat "$PID_FILE"). Виходжу."
        exit 1
    fi
    echo $$ > "$PID_FILE"
    # Видалення PID файлу при завершенні роботи
    trap 'rm -f "$PID_FILE"; log "👋 Зупинка моніторингу."' EXIT

    log "🚀 Запуск ефективного моніторингу активності через fswatch..."
    while true; do
        # Очікуємо на подію або таймаут. fswatch повертає 0 при події, 1 при таймауті.
        fswatch --one-event --event Updated --timeout "$IDLE_TIMEOUT" "$TENNIS_CHANNEL" > /dev/null 2>&1

        if [ $? -eq 1 ]; then
            # Таймаут - немає активності
            log "⚠️ Немає активності протягом $IDLE_TIMEOUT секунд. Змінюю модель..."
            switch_model
            post_switch_notification
        else
            # Подія відбулася - активність є
            log "✅ Активність зафіксована. Таймер скинуто."
        fi
    done
}

main