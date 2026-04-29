#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# 🦅 PREDATOR Analytics v56.5-ELITE
# PREDATOR SENTINEL v2.0 — Multi-Node Tunnel Orchestrator
# ═══════════════════════════════════════════════════════════════════

set -u

# Конфігурація шляхів
ZROK_BIN="${ZROK_BIN:-${HOME}/bin/zrok}"
LOG_DIR="${HOME}/.zrok/logs"
STATE_DIR="${HOME}/.zrok/state"
mkdir -p "$LOG_DIR" "$STATE_DIR"

LOG_FILE="${LOG_DIR}/sentinel.log"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Перевірка доступності порту (Python-based)
tcp_open() {
    local host=$1
    local port=$2
    python3 - "$host" "$port" <<'PY' >/dev/null 2>&1
import socket
import sys
sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.settimeout(1.5)
try:
    sock.connect((sys.argv[1], int(sys.argv[2])))
    sys.exit(0)
except:
    sys.exit(1)
finally:
    sock.close()
PY
}

# Керування SHARE (Серверна частина - надаємо доступ)
# Usage: manage_share "name" "target_port"
manage_share() {
    local name=$1
    local target=$2
    local log_p="${LOG_DIR}/share_${name}.log"

    if pgrep -f "zrok share reserved ${name}" > /dev/null; then
        log "🟢 SHARE [${name}]: Процес активний."
    else
        log "🟡 SHARE [${name}]: Запуск тунелю для порту ${target}..."
        "$ZROK_BIN" share reserved "$name" --headless > "$log_p" 2>&1 &
        sleep 2
    fi
}

# Керування ACCESS (Клієнтська частина - підключаємось)
# Usage: manage_access "name" "bind_host" "bind_port"
manage_access() {
    local name=$1
    local host=$2
    local port=$3
    local log_p="${LOG_DIR}/access_${name}.log"

    if tcp_open "$host" "$port"; then
        log "🟢 ACCESS [${name}]: Порт ${host}:${port} активний."
    else
        if pgrep -f "zrok access private ${name} --bind ${host}:${port}" > /dev/null; then
            log "⚠️ ACCESS [${name}]: Процес є, але порт не відповідає. Очікування..."
        else
            log "🔍 ACCESS [${name}]: Підключення до віддаленого вузла на ${host}:${port}..."
            : > "$log_p"
            "$ZROK_BIN" access private "$name" --bind "${host}:${port}" > "$log_p" 2>&1 &
            sleep 3
        fi
    fi
}

log "🛰️ Predator Sentinel v2.0 стартував."

while true; do
    # 1. Перевірка авторизації
    if ! "$ZROK_BIN" status > /dev/null 2>&1; then
        log "❌ Помилка: zrok не авторизований."
        sleep 30
        continue
    fi

    # ══════════════════════════════════════════════════════════════
    # РЕЄСТР ВУЗЛІВ (Node Registry)
    # ══════════════════════════════════════════════════════════════

    # Локальні ресурси (що ми віддаємо)
    # На MacBook ми віддаємо SSH (порт 22)
    manage_share "predatorssh" "22"

    # Віддалені ресурси (до чого ми підключаємось)
    # 1. NVIDIA Server (.240)
    manage_access "predatornvidiassh" "127.0.0.1" "2224"
    
    # 2. iMac (.199)
    manage_access "predatorimacssh" "127.0.0.1" "2225"

    # 3. K8s API (якщо потрібно)
    # manage_access "predatork8s" "127.0.0.1" "6443"

    sleep 60
done
