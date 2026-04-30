#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# 🦅 PREDATOR Analytics v56.5-ELITE
# MAC ZROK SENTINEL — автоматичний моніторинг та підключення тунелів
# ═══════════════════════════════════════════════════════════════════

set -u

ZROK_BIN="${ZROK_BIN:-${HOME}/bin/zrok}"
LOG_FILE="${ZROK_LOG_FILE:-${HOME}/.zrok/sentinel.log}"
SSH_SHARE="${ZROK_SSH_SHARE:-predatorssh}"
K8S_SHARE="${ZROK_K8S_SHARE:-predatork8s}"
SSH_BIND_HOST="${ZROK_SSH_BIND_HOST:-127.0.0.1}"
SSH_BIND_PORT="${ZROK_SSH_BIND_PORT:-2222}"
K8S_BIND_HOST="${ZROK_K8S_BIND_HOST:-127.0.0.1}"
K8S_BIND_PORT="${ZROK_K8S_BIND_PORT:-6443}"
SLEEP_READY="${ZROK_SENTINEL_READY_SLEEP:-30}"
SLEEP_RETRY="${ZROK_SENTINEL_RETRY_SLEEP:-60}"

mkdir -p "$(dirname "$LOG_FILE")"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

tcp_open() {
    local host=$1
    local port=$2
    python3 - "$host" "$port" <<'PY' >/dev/null 2>&1
import socket
import sys

sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.settimeout(1.0)
try:
    sock.connect((sys.argv[1], int(sys.argv[2])))
except OSError:
    sys.exit(1)
finally:
    sock.close()
PY
}

ensure_access() {
    local share=$1
    local host=$2
    local port=$3
    local label=$4
    local access_log="${HOME}/.zrok/${share}.access.log"

    if tcp_open "$host" "$port"; then
        log "🟢 ${label} активний на ${host}:${port}"
        return 0
    fi

    if pgrep -f "zrok access private ${share}" >/dev/null; then
        if [ "${ZROK_FORCE_RESTART:-0}" = "1" ]; then
            log "⚠️ ${label}: процес існує, але порт ${host}:${port} не слухає. Перезапускаю."
            pkill -f "zrok access private ${share}" 2>/dev/null || true
        else
            log "⚠️ ${label}: процес існує, але порт ${host}:${port} ще не слухає. Очікую."
            return 1
        fi
    fi

    log "🔍 Підключаю ${label}: ${share} → ${host}:${port}"
    : > "$access_log"
    "$ZROK_BIN" access private "$share" --bind "${host}:${port}" --headless >"$access_log" 2>&1 &
    sleep 3

    if tcp_open "$host" "$port"; then
        log "✅ ${label} активовано: ${host}:${port}"
        return 0
    fi

    if [ -s "$access_log" ]; then
        log "⚠️ ${label} не активовано. Лог: $(head -3 "$access_log" | tr '\n' ' ')"
    else
        log "⚠️ ${label} не активовано. Перевірте, чи share '${share}' запущений на NVIDIA сервері."
    fi
    return 1
}

touch "$LOG_FILE"

log "🛰️ Sentinel запущено. Очікування активних тунелів на сервері..."

while true; do
    if [ ! -x "$ZROK_BIN" ]; then
        log "❌ zrok не знайдено: ${ZROK_BIN}"
        sleep "$SLEEP_RETRY"
        continue
    fi

    # Перевірка з'єднання з zrok service.
    if ! "$ZROK_BIN" status > /dev/null 2>&1; then
        log "⚠️ zrok не авторизований або відключений. Перевірка оточення..."
        sleep "$SLEEP_RETRY"
        continue
    fi

    ensure_access "$SSH_SHARE" "$SSH_BIND_HOST" "$SSH_BIND_PORT" "SSH тунель"
    ensure_access "$K8S_SHARE" "$K8S_BIND_HOST" "$K8S_BIND_PORT" "K8s тунель"

    if tcp_open "$SSH_BIND_HOST" "$SSH_BIND_PORT" && tcp_open "$K8S_BIND_HOST" "$K8S_BIND_PORT"; then
        log "🟢 Всі тунелі активні. Моніторинг..."
        sleep "$SLEEP_READY"
    else
        sleep "$SLEEP_RETRY"
    fi
done
