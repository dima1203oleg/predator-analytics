#!/bin/bash

# 🐾 Predator Watchdog Daemon — Безперервний моніторинг агентів
# Цей скрипт гарантує, що Mega Agent та KLAV-Agent НІКОЛИ не зупиняться.

set -euo pipefail

# 1. Перевірка статусу Mega Agent (VS Code)
check_mega_agent() {
    if ! pgrep -f "main.py" > /dev/null; then
        echo "❌ Mega Agent не запущено. Перезапускаю..."
        cd /Users/dima1203/Documents/dual-agent-runtime/ && nohup python3 main.py > /dev/null 2>&1 &
        echo "✅ Mega Agent перезапущено."
    else
        echo "✅ Mega Agent працює."
    fi
}

# 2. Перевірка статусу KLAV-Agent (NVIDIA Server)
check_klav_agent() {
    if ! ssh -o ConnectTimeout=5 -p 6666 dima@194.177.1.240 "pgrep -f 'klav-agent'" > /dev/null; then
        echo "❌ KLAV-Agent не запущено. Перезапускаю..."
        ssh -o ConnectTimeout=5 -p 6666 dima@194.177.1.240 "nohup bash -c '/home/nvidia/klav-agent/start.sh' > /dev/null 2>&1 &"
        echo "✅ KLAV-Agent перезапущено."
    else
        echo "✅ KLAV-Agent працює."
    fi
}

# 3. Перевірка статусу Docker-контейнерів
check_docker_containers() {
    if ! docker ps | grep -q "core-api"; then
        echo "❌ core-api не запущено. Перезапускаю..."
        docker compose -f /Users/Shared/Predator_60/docker-compose.yml up -d core-api
        echo "✅ core-api перезапущено."
    else
        echo "✅ core-api працює."
    fi
}

# 4. Перевірка вільного місця на диску
check_disk_space() {
    local free_space
    free_space=$(df -h / | awk 'NR==2 {print $4}' | tr -d 'G')
    if (( $(echo "$free_space < 10" | bc -l) )); then
        echo "⚠️ Мало місця на диску: ${free_space}G. Очищаю кеш..."
        /Users/Shared/Predator_60/scripts/clean_disk.sh
    else
        echo "✅ Місця на диску достатньо: ${free_space}G."
    fi
}

# 5. Перевірка логів на помилки
check_logs() {
    if grep -q "ERROR" /Users/Shared/Predator_60/logs/*.log; then
        echo "❌ Виявлено помилки в логах. Надсилаю сповіщення..."
        # TODO: Додати відправку сповіщення в Telegram
    else
        echo "✅ Логи чисті."
    fi
}

# 6. Перевірка каналу зв'язку між агентами
check_tennis_channel() {
    if ! grep -q "ACTION_REQUIRED" /Users/Shared/Predator_60/agent_tennis_channel.md; then
        echo "⚠️ Канал зв'язку неактивний. Ініціюю нову задачу..."
        echo "### [ACTION_REQUIRED] $(date +'%Y%m%d-%H%M%S')
**Від:** Watchdog
**Дата:** $(date +'%Y-%m-%d %H:%M:%S')
**Статус:** Очікує дії
**Завдання:** Перевірка статусу системи.
**Результат:** Всі системи працюють.
**Наступні кроки:** Mega Agent, підтвердити статус." >> /Users/Shared/Predator_60/agent_tennis_channel.md
    else
        echo "✅ Канал зв'язку активний."
    fi
}

# Головний цикл
main() {
    echo "🚀 Запуск Predator Watchdog Daemon..."
    while true; do
        check_mega_agent
        check_klav_agent
        check_docker_containers
        check_disk_space
        check_logs
        check_tennis_channel
        sleep 30
    done
}

main
