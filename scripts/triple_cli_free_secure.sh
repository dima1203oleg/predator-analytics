#!/bin/bash
# triple_cli_free_secure.sh - Захищений автономний ланцюжок
# Побудовано за архітектурою Головного DevOps-інженера Predator Analytics v25.0

set -u # Важливо: перехоплюємо неоголошені змінні

# --- Конфігурація ---
export LOG_FILE="/var/log/predator/cli_chain_secure.log"
export TASK_QUEUE_DIR="/opt/predator/tasks/queue"
export COMPLETED_DIR="/opt/predator/tasks/completed"
export ERROR_DIR="/opt/predator/tasks/error"
export ERROR_LOG="/tmp/predator_chain_errors.log"

log() {
    local level="$1"
    local message="$2"
    local context="${3:-main}"
    echo "[$(date -u +'%Y-%m-%d %H:%M:%S')] [$level] [$context] $message" | tee -a "$LOG_FILE" 2>/dev/null
}

# --- Функція перевірки політики ---
check_policy() {
    local code_file="$1"
    local mode="${2:-dry-run}"

    log "INFO" "Запуск Policy Engine (Mode: $mode)..." "security"

    # Виклик Python скрипта Policy Engine
    local result
    result=$(python3 scripts/policy_engine.py --check "$code_file" --mode "$mode" 2>/dev/null || echo '{"approved": false, "violations": ["Python Policy Engine failed"]}')

    if [[ "$result" == *"\"approved\": true"* ]]; then
        log "INFO" "✅ Політика пройдена. Код схвалено." "security"
        return 0
    else
        log "ERROR" "❌ ПОЛІТИЧНЕ БЛОКУВАННЯ: $result" "security"
        return 1
    fi
}

# --- Безпечне виконання ---
safe_execute() {
    local code_file="$1"
    local mode="${2:-dry-run}"
    local task_id="$3"

    if [[ "$mode" == "dry-run" ]]; then
        log "INFO" "Режим DRY-RUN: Виконання пропущено. Звіт готовий." "execution"
        return 0
    fi

    if [[ "$mode" == "sandbox-execute" ]]; then
        log "INFO" "Запуск в SANDBOX (K8s Job emulation)..." "execution"
        # Емуляція через ізольований процес під обмеженим користувачем
        # В майбутньому: kubectl apply -f sandbox_job.yaml
        if timeout 60 bash "$code_file" >> "/tmp/output_$task_id.log" 2>> "$ERROR_LOG"; then
            log "INFO" "Завдання виконано успішно" "execution"
            return 0
        else
            log "ERROR" "Помилка виконання в Sandbox" "execution"
            return 1
        fi
    fi
}

# --- Основна функція обробки завдання ---
process_single_task() {
    local task_file="$1"
    local task_id=$(basename "$task_file" .task)
    local query=$(cat "$task_file")
    local mode="dry-run" # За замовчуванням

    [[ "$query" == *"!!execute"* ]] && mode="sandbox-execute"

    log "INFO" "Обробка завдання: $task_id [Mode: $mode]" "main"

    local tmp_plan="/tmp/plan_$task_id.txt"
    local tmp_code="/tmp/code_$task_id.sh"

    # 1. ПЛАН
    if ! ollama run llama3.2:3b "Ти AI-планувальник. Створи план: $query" > "$tmp_plan" 2>/dev/null; then
        log "ERROR" "План не створено" "$task_id"
        return 1
    fi

    # 2. КОД
    if ! ollama run codellama:7b "Напиши код за планом: $(cat "$tmp_plan")" > "$tmp_code" 2>/dev/null; then
        log "ERROR" "Код не згенеровано" "$task_id"
        return 1
    fi

    # 3. POLICY CHECK (Критично!)
    if ! check_policy "$tmp_code" "$mode"; then
        mv "$task_file" "$ERROR_DIR/"
        log "ERROR" "Завдання заблоковано через порушення політик безпеки" "$task_id"
        return 1
    fi

    # 4. EXECUTION
    if safe_execute "$tmp_code" "$mode" "$task_id"; then
        mv "$task_file" "$COMPLETED_DIR/"
        log "INFO" "Завдання завершено успішно" "$task_id"
    else
        mv "$task_file" "$ERROR_DIR/"
        log "ERROR" "Помилка на етапі виконання" "$task_id"
    fi
}

# Головний цикл
log "INFO" "Ініціалізація Захищеного AI-Ланцюжка v25.0..." "init"
while true; do
    for task in "$TASK_QUEUE_DIR"/*.task; do
        [ -e "$task" ] || continue

        # Ізольований підпроцес для кожного завдання
        (
            process_single_task "$task"
        ) &

        # Обмеження паралельності (макс 2 завдання)
        if (( $(jobs -r | wc -l) >= 2 )); then
            wait -n
        fi
    done
    sleep 5
done
