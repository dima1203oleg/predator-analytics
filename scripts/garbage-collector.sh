#!/bin/bash
# GARBAGE_COLLECTOR.sh - Агресивне очищення "бруду" (пам'яті та диска)
# Моніторить залишок RAM та дискового простору, знищуючи непотрібні файли та процеси.

set -u

THRESHOLD_RAM_PERCENT=85
THRESHOLD_DISK_PERCENT=90

echo "🧹 Запуск Автоматичного Збирача Бруду (Garbage Collector)..."

while true; do
    # Перевірка RAM (Linux/macOS адаптація)
    if command -v free >/dev/null 2>&1; then
        RAM_TOTAL=$(free -m | awk '/^Mem:/{print $2}')
        RAM_USED=$(free -m | awk '/^Mem:/{print $3}')
        RAM_PERCENT=$(( 100 * RAM_USED / RAM_TOTAL ))
    else
        # macOS
        RAM_PERCENT=$(ps -A -o %mem | awk '{s+=$1} END {print int(s)}')
    fi

    # Перевірка Диску
    DISK_PERCENT=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')

    if [ "$RAM_PERCENT" -gt "$THRESHOLD_RAM_PERCENT" ] || [ "$DISK_PERCENT" -gt "$THRESHOLD_DISK_PERCENT" ]; then
        echo "🚨 [ПОПЕРЕДЖЕННЯ] Виявлено критичне навантаження! (RAM: $RAM_PERCENT%, DISK: $DISK_PERCENT%)"
        echo "💥 Запуск агресивного очищення системи від бруду..."

        # 1. Очищення старих логів
        find /tmp -name "*.log" -type f -mtime +1 -exec rm -f {} \;
        find /Users/Shared/Predator_60 -name "*.log" -type f -mtime +3 -exec rm -f {} \;
        
        # 2. Очищення Docker-сміття (dangling images, stopped containers)
        if command -v docker >/dev/null 2>&1; then
            echo "🐳 Очищення Docker-кешу..."
            docker system prune -a -f --volumes
        fi

        # 3. Вбивання "зомбі" та завислих процесів Python/Node, які не є життєво важливими
        echo "🧟 Знищення зомбі-процесів..."
        ps aux | awk '$8=="Z" {print $2}' | xargs -r kill -9 2>/dev/null || true

        # 4. Очищення кешу пакетних менеджерів
        if command -v npm >/dev/null 2>&1; then npm cache clean --force; fi
        if command -v pip >/dev/null 2>&1; then pip cache purge; fi
        
        # Звільнення RAM (скидання кешів файлової системи) на Linux
        if [ -w /proc/sys/vm/drop_caches ]; then
            sync; echo 3 > /proc/sys/vm/drop_caches
        fi
        
        echo "✅ Очищення завершено! Пам'ять звільнено від бруду."
    fi

    # Перевіряти кожні 5 хвилин
    sleep 300
done
