#!/usr/bin/env bash
# Демон обробки задач для Claw Code (працює на NVIDIA сервері)

set -euo pipefail

CLAW_DIR="$HOME/claw-code"
TASKS_PENDING="$HOME/predator_tasks/pending"
TASKS_DONE="$HOME/predator_tasks/done"
CLAW_BIN="$CLAW_DIR/rust/target/release/claw"

mkdir -p "$TASKS_PENDING" "$TASKS_DONE"

echo "Task Worker started. Waiting for tasks in $TASKS_PENDING..."

while true; do
  # Шукаємо всі .json задачі в папці pending
  for TASK_FILE in "$TASKS_PENDING"/*.json; do
    # Якщо файлів немає, bash залишить '*.json' як ім'я файлу
    if [ ! -f "$TASK_FILE" ]; then
      continue
    fi
    
    # Витягуємо ID та Prompt за допомогою jq (або grep, якщо jq немає)
    # Якщо jq відсутній, просто читаємо весь файл як промпт
    if command -v jq >/dev/null 2>&1; then
        TASK_ID=$(jq -r '.id' "$TASK_FILE")
        PROMPT=$(jq -r '.prompt' "$TASK_FILE")
    else
        TASK_ID=$(basename "$TASK_FILE" .json)
        PROMPT=$(cat "$TASK_FILE")
    fi

    echo "Processing Task: $TASK_ID"
    
    # Запускаємо Claw Code з цим промптом
    cd "$CLAW_DIR"
    # Якщо потрібно, щоб claw автоматично зберігав або використовував RAG, можна додати відповідні прапорці
    # Для автономності додаємо інструкцію в кінець
    FULL_PROMPT="$PROMPT (Виконай це АВТОНОМНО, без питань. Збережи результат.)"
    
    # Зберігаємо результат в тимчасовий лог
    TMP_LOG="/tmp/claw_task_${TASK_ID}.log"
    if source $HOME/.cargo/env && "$CLAW_BIN" prompt "$FULL_PROMPT" > "$TMP_LOG" 2>&1; then
        echo "Task $TASK_ID completed successfully."
        STATUS="success"
    else
        echo "Task $TASK_ID failed."
        STATUS="error"
    fi
    
    # Формуємо файл-результат
    RESULT_FILE="$TASKS_DONE/${TASK_ID}_result.json"
    if command -v jq >/dev/null 2>&1; then
        jq -n --arg id "$TASK_ID" --arg status "$STATUS" --arg log "$(cat "$TMP_LOG")" \
          '{id: $id, status: $status, output: $log}' > "$RESULT_FILE"
    else
        echo "STATUS: $STATUS" > "$RESULT_FILE"
        cat "$TMP_LOG" >> "$RESULT_FILE"
    fi
    
    # Видаляємо виконану задачу та тимчасовий лог
    rm "$TASK_FILE" "$TMP_LOG"
  done
  
  sleep 5
done
