#!/bin/bash

# Скрипт для моніторингу системних ресурсів

LOG_FILE="/Users/Shared/Predator_60/logs/monitor_resources.log"
ALERT_FILE="/Users/Shared/Predator_60/logs/alert_resources.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

alert() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️ $1" >> "$ALERT_FILE"
}

# Отримання використання CPU та RAM
CPU_USAGE=$(top -l 1 -n 0 | grep "CPU usage" | awk '{print $3}' | sed 's/%//')
RAM_USAGE=$(top -l 1 -n 0 | grep "PhysMem" | awk '{print $2}' | sed 's/M//')

log "Використання CPU: $CPU_USAGE%"
log "Використання RAM: $RAM_USAGE MB"

# Перевірка використання CPU
if (( $(echo "$CPU_USAGE > 90" | bc -l) )); then
    alert "Високе використання CPU: $CPU_USAGE%"
fi

# Перевірка використання RAM
if (( $(echo "$RAM_USAGE > 16000" | bc -l) )); then
    alert "Високе використання RAM: $RAM_USAGE MB"
fi

# Перевірка кількості доступних PTY
PTY_COUNT=$(sysctl -n kern.tty.ptmx_max)
PTY_USED=$(ls /dev/ttys* | wc -l)
PTY_FREE=$((PTY_COUNT - PTY_USED))

log "Доступно PTY: $PTY_FREE з $PTY_COUNT"

if (( PTY_FREE < 10 )); then
    alert "Низька кількість вільних PTY: $PTY_FREE з $PTY_COUNT"
fi

log "Моніторинг завершено."