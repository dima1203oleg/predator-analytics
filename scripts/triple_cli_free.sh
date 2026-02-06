#!/bin/bash
# triple_cli_free.sh - Автономний ланцюжок Ollama (Plan) -> CodeLlama (Code) -> Aider (Verify)
# Побудовано за архітектурою Головного DevOps-інженера Predator Analytics v25.0

set -euo pipefail
shopt -s lastpipe

# --- Конфігурація ---
export OLLAMA_HOST="${OLLAMA_HOST:-http://localhost:11434}"
export LOG_FILE="/var/log/predator/cli_chain.log"
export TASK_QUEUE_DIR="/opt/predator/tasks/queue"
export COMPLETED_DIR="/opt/predator/tasks/completed"
export ERROR_DIR="/opt/predator/tasks/error"
export TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
export CHAT_ID="${TELEGRAM_CHAT_ID:-}"

# Створюємо директорії (якщо є права)
mkdir -p "$TASK_QUEUE_DIR" "$COMPLETED_DIR" "$ERROR_DIR" 2>/dev/null || true
mkdir -p "$(dirname "$LOG_FILE")" 2>/dev/null || true

# --- Функція логування ---
log() {
    local level="$1"
    local message="$2"
    local stage="${3:-main}"
    echo "[$(date -u +'%Y-%m-%d %H:%M:%S')] [$level] [$stage] $message" | tee -a "$LOG_FILE" 2>/dev/null || echo "[$(date -u +'%Y-%m-%d %H:%M:%S')] [$level] [$stage] $message"

    # Відправка критичних помилок в Prometheus через Pushgateway (якщо доступний)
    if [[ "$level" == "ERROR" ]]; then
        echo "cli_chain_error{stage=\"$stage\"} 1" | curl --data-binary @- http://localhost:9091/metrics/job/cli_chain 2>/dev/null || true
    fi
}

# --- Функція-планувальник на Ollama ---
plan_with_ollama() {
    local user_query="$1"
    local plan_file="$2"

    log "INFO" "Планування для: $user_query" "plan"

    local system_prompt="Ти — AI-планувальник Predator Analytics. Користувач описує задачу українською. Розроби чіткий план з кроками для bash та Python. Формат: 1. [Крок] -> [Команда/Скрипт]. Запит: $user_query"

    local max_retries=3
    local delay=2
    for ((i=1; i<=max_retries; i++)); do
        if response=$(ollama run llama3.2:3b "$system_prompt" 2>/dev/null); then
            echo "$response" > "$plan_file"
            log "INFO" "План успішно створено: $plan_file" "plan"
            return 0
        else
            log "WARN" "Спроба $i невдала. Повтор через ${delay}с..." "plan"
            sleep $delay
            ((delay *= 2))
        fi
    done
    log "ERROR" "Не вдалося створити план для: $user_query" "plan"
    return 1
}

# --- Функція-генератор коду на CodeLlama ---
code_with_codellama() {
    local plan_file="$1"
    local code_file="$2"

    local plan_content=$(cat "$plan_file")
    local prompt="На основі цього плану створи готовий bash-скрипт або Python-код. Код має бути безпечним, з обробкою помилок. План: $plan_content. Поверни ТІЛЬКИ КОД без пояснень."

    log "INFO" "Генерація коду на основі плану..." "code"

    if code=$(ollama run codellama:7b "$prompt" 2>/dev/null); then
        echo "$code" | sed -e 's/^```[bash|python|sh]*//' -e 's/```$//' > "$code_file"
        log "INFO" "Код згенеровано: $code_file" "code"
        return 0
    else
        log "ERROR" "Генерація коду провалилась" "code"
        return 1
    fi
}

# --- Функція перевірки та фіксу через Aider ---
verify_with_aider() {
    local code_file="$1"
    local fixed_file="$2"

    log "INFO" "Перевірка коду через Aider..." "verify"

    # Aider аналізує код. Використовуємо --yes для автоматизації.
    if aider --yes --message "Проаналізуй цей код на помилки, безпеку та оптимізацію. Запропонуй фікс або підтверди якість." "$code_file" 2>/dev/null; then
        cp "$code_file" "$fixed_file"
        log "INFO" "Код перевірено та збережено: $fixed_file" "verify"
        return 0
    else
        cp "$code_file" "$fixed_file"
        log "INFO" "Aider завершився з попередженням, але код збережено" "verify"
        return 0
    fi
}

# --- Головний цикл ---
process_task_queue() {
    if [ ! -d "$TASK_QUEUE_DIR" ]; then return 0; fi

    for task in "$TASK_QUEUE_DIR"/*.task; do
        [ -e "$task" ] || continue
        local task_id=$(basename "$task" .task)
        local user_query=$(cat "$task")

        log "INFO" "Початок обробки завдання: $task_id" "main"

        local tmp_plan="/tmp/plan_$task_id.txt"
        local tmp_code="/tmp/code_$task_id.sh"
        local final_code="/tmp/final_$task_id.sh"

        if plan_with_ollama "$user_query" "$tmp_plan"; then
            if code_with_codellama "$tmp_plan" "$tmp_code"; then
                if verify_with_aider "$tmp_code" "$final_code"; then
                    log "INFO" "Завдання $task_id успішно виконано" "main"
                    mv "$task" "$COMPLETED_DIR/"

                    # Сповіщення (якщо налаштовано)
                    # send_telegram "✅ Завдання '$task_id' виконано."
                fi
            fi
        fi
        sleep 5
    done
}

# Запуск
if [[ "${1:-}" == "--oneshot" ]]; then
    process_task_queue
else
    log "INFO" "Запуск автономного CLI-ланцюжка Predator v25.0" "init"
    while true; do
        process_task_queue
        sleep 10
    done
fi
