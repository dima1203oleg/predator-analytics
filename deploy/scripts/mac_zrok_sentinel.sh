#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# 🦅 PREDATOR Analytics v56.5-ELITE
# MAC ZROK SENTINEL — Автоматичний моніторинг та підключення тунелів
# ═══════════════════════════════════════════════════════════════════

ZROK_BIN="${HOME}/bin/zrok"
LOG_FILE="${HOME}/.zrok/sentinel.log"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Створення лог-файлу якщо немає
touch "$LOG_FILE"

log "🛰️ Sentinel запущено. Очікування активних тунелів на сервері..."

while true; do
    # Перевірка з'єднання з zrok service
    if ! "$ZROK_BIN" status > /dev/null 2>&1; then
        log "⚠️ zrok не авторизований або відключений. Перевірка оточення..."
        sleep 10
        continue
    fi

    # Спроба знайти SSH тунель
    if ! pgrep -f "zrok access private predatorssh" > /dev/null; then
        log "🔍 Пошук частки 'predatorssh'..."
        # Overview може повернути багато даних, шукаємо наш унікальний id
        if "$ZROK_BIN" overview | grep -q "predatorssh"; then
            log "🚀 Знайдено predatorssh! Підключення локальної точки доступу на порт 2222..."
            "$ZROK_BIN" access private predatorssh --bind 127.0.0.1:2222 > /dev/null 2>&1 &
            log "✅ SSH тунель активовано: ssh dima@120.0.0.1 -p 2222"
        fi
    fi

    # Спроба знайти K8s тунель
    if ! pgrep -f "zrok access private predatork8s" > /dev/null; then
        log "🔍 Пошук частки 'predatork8s'..."
        if "$ZROK_BIN" overview | grep -q "predatork8s"; then
            log "🚀 Знайдено predatork8s! Підключення локальної точки доступу на порт 6443..."
            "$ZROK_BIN" access private predatork8s --bind 127.0.0.1:6443 > /dev/null 2>&1 &
            log "✅ K8s тунель активовано: kubectl --kubeconfig=k8s/kubeconfig_proxied get nodes"
        fi
    fi

    # Перевірка статусу існуючих процесів
    SSH_PID=$(pgrep -f "zrok access private predatorssh")
    K8S_PID=$(pgrep -f "zrok access private predatork8s")
    
    if [ ! -z "$SSH_PID" ] && [ ! -z "$K8S_PID" ]; then
        log "🟢 Всі тунелі активні. Моніторинг..."
        sleep 30
    else
        sleep 10
    fi
done
