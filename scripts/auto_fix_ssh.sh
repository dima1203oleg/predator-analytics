#!/usr/bin/env bash
# =============================================================================
# auto_fix_ssh.sh — Надійне SSH підключення до NVIDIA сервера (Predator Analytics)
# Версія: 2.0 — з повним набором резервних варіантів і авто-відновленням
# =============================================================================

set -uo pipefail

# ─────────────────────────── Кольори ────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'
log()  { echo -e "${CYAN}[$(date '+%H:%M:%S')]${NC} $*"; }
ok()   { echo -e "${GREEN}✅${NC} $*"; }
warn() { echo -e "${YELLOW}⚠️ ${NC} $*"; }
err()  { echo -e "${RED}❌${NC} $*"; }

# ─────────────────────────── Конфігурація ───────────────────────────────────
ZROK_TOKEN="${ZROK_TOKEN:-1eeje4um7yvA}"
ZROK_BIN="${HOME}/bin/zrok"
ZROK_SHARE="predatorssh"
ZROK_BIND_HOST="127.0.0.1"
ZROK_BIND_PORT="2222"
LOG_DIR="${HOME}/.zrok"
SSH_LOG="${LOG_DIR}/auto_fix_ssh_debug.log"
KEY="${HOME}/.ssh/id_ed25519_dev"
REMOTE_USER="dima"
# Резервні цілі: прямий IP (якщо відкрито firewall) та GCP
DIRECT_HOST="${NVIDIA_PRIMARY_HOST:-194.177.1.240}"
DIRECT_PORT="${NVIDIA_PRIMARY_PORT:-6666}"
GCP_HOST="${NVIDIA_GCP_HOST:-34.185.226.240}"
GCP_PORT="${NVIDIA_GCP_PORT:-22}"
TUNNEL_MAX_WAIT=30   # секунд чекати на тунель
SSH_TIMEOUT=8        # секунд timeout SSH-спроби
MAX_RETRIES=3        # кількість повторів на кожну ціль

mkdir -p "$LOG_DIR"

# ─────────────────────────── SSH-параметри ──────────────────────────────────
# Широкий набір алгоритмів для максимальної сумісності
SSH_OPTS=(
  -o BatchMode=yes
  -o ConnectTimeout="${SSH_TIMEOUT}"
  -o StrictHostKeyChecking=no
  -o UserKnownHostsFile=/dev/null
  -o ServerAliveInterval=10
  -o ServerAliveCountMax=3
  -o LogLevel=DEBUG3
)

# ─────────────────────────── Утиліти ────────────────────────────────────────
port_open() {
  nc -z -w2 "$1" "$2" >/dev/null 2>&1
}

ssh_banner_check() {
  # Перевіряємо чи SSH-сервер відповідає справжнім SSH-банером (не просто TCP)
  local host=$1 port=$2
  python3 -c "
import socket
try:
    s = socket.socket()
    s.settimeout(3.0)
    s.connect(('$host', int('$port')))
    data = s.recv(1024).decode('utf-8', 'ignore')
    if 'SSH-' in data:
        exit(0)
except:
    pass
exit(1)
" 2>/dev/null
}

try_ssh() {
  local label=$1 host=$2 port=$3 key=$4 user=$5
  log "Спроба SSH: ${label} → ${user}@${host}:${port}"
  local log_file="${LOG_DIR}/ssh_try_${label}.log"
  for attempt in $(seq 1 "${MAX_RETRIES}"); do
    log "  спроба ${attempt}/${MAX_RETRIES}…"
    if ssh "${SSH_OPTS[@]}" -i "$key" -p "$port" "${user}@${host}" \
         "echo SSH_OK" >"$log_file" 2>&1 | grep -q "SSH_OK" 2>/dev/null; then
      ok "${label}: підключення успішне!"
      echo "$host $port $user $key" > "${LOG_DIR}/last_success.txt"
      return 0
    fi
    # Показати останній рядок лога для швидкої діагностики
    local last
    last=$(tail -1 "$log_file" 2>/dev/null || true)
    warn "  ${label} спроба ${attempt} не вдалась: ${last}"
    [ "$attempt" -lt "${MAX_RETRIES}" ] && sleep 2
  done
  err "${label}: всі ${MAX_RETRIES} спроби вичерпано"
  return 1
}

# ─────────────────────────── Крок 0: Очищення ───────────────────────────────
log "Крок 0/5 — Зупиняємо застарілі zrok-процеси…"
pkill -f "zrok access private ${ZROK_SHARE}" 2>/dev/null || true
sleep 1

# ─────────────────────────── Крок 1: zrok enable ────────────────────────────
log "Крок 1/5 — Перевіряємо стан zrok…"
if ! "${ZROK_BIN}" status 2>/dev/null | grep -q "<<SET>>"; then
  log "  Вмикаємо zrok (token: ${ZROK_TOKEN:0:4}***)"
  if ! "${ZROK_BIN}" enable "${ZROK_TOKEN}" 2>&1; then
    warn "  zrok enable не вдалось — продовжуємо (можливо вже активовано)"
  fi
else
  ok "zrok вже активовано"
fi

# ─────────────────────────── Крок 2: Тунель ─────────────────────────────────
log "Крок 2/5 — Запускаємо zrok private share…"
"${ZROK_BIN}" access private "${ZROK_SHARE}" \
  --bind "${ZROK_BIND_HOST}:${ZROK_BIND_PORT}" \
  --headless >"${LOG_DIR}/${ZROK_SHARE}.access.log" 2>&1 &
ZROK_PID=$!

log "  Очікуємо готовності порту ${ZROK_BIND_PORT} (до ${TUNNEL_MAX_WAIT}с)…"
TUNNEL_READY=0
for i in $(seq 1 $((TUNNEL_MAX_WAIT / 2))); do
  if port_open "${ZROK_BIND_HOST}" "${ZROK_BIND_PORT}"; then
    ok "Тунель слухає на ${ZROK_BIND_HOST}:${ZROK_BIND_PORT}"
    TUNNEL_READY=1
    break
  fi
  echo -n "."
  sleep 2
done
echo ""

if [ "${TUNNEL_READY}" -eq 0 ]; then
  err "Тунель так і не запустився за ${TUNNEL_MAX_WAIT}с"
  warn "Логи zrok: $(cat "${LOG_DIR}/${ZROK_SHARE}.access.log" 2>/dev/null | head -5)"
fi

# ─────────────────────────── Крок 3: SSH-банер ──────────────────────────────
log "Крок 3/5 — Перевіряємо SSH-банер на ${ZROK_BIND_HOST}:${ZROK_BIND_PORT}…"
if [ "${TUNNEL_READY}" -eq 1 ]; then
  if ssh_banner_check "${ZROK_BIND_HOST}" "${ZROK_BIND_PORT}"; then
    ok "SSH-банер отримано — сервер відповідає!"
  else
    warn "SSH-банер НЕ отримано (сервер скидає з'єднання під час KEX)"
    warn "Можлива причина: SSH-демон на NVIDIA-сервері не запущено або"
    warn "zrok-share на сервері не форвардить на правильний порт."
    warn "Перевірте на сервері: systemctl status sshd && ss -tlnp | grep :22"
  fi
fi

# ─────────────────────────── Крок 4: Додаємо ключ ───────────────────────────
log "Крок 4/5 — Спроба додати public key до authorized_keys…"
PUBKEY=$(cat "${KEY}.pub" 2>/dev/null || true)
if [ -z "${PUBKEY}" ]; then
  err "Публічний ключ не знайдено: ${KEY}.pub"
else
  # Спробуємо додати ключ через тунель (якщо банер є)
  if [ "${TUNNEL_READY}" -eq 1 ] && ssh_banner_check "${ZROK_BIND_HOST}" "${ZROK_BIND_PORT}"; then
    log "  Додаємо ключ через zrok-тунель…"
    if ssh "${SSH_OPTS[@]}" \
         -i "$KEY" -p "${ZROK_BIND_PORT}" "${REMOTE_USER}@${ZROK_BIND_HOST}" \
         "mkdir -p ~/.ssh && chmod 700 ~/.ssh && \
          grep -qxF '${PUBKEY}' ~/.ssh/authorized_keys 2>/dev/null || \
          echo '${PUBKEY}' >> ~/.ssh/authorized_keys && \
          chmod 600 ~/.ssh/authorized_keys && \
          echo KEY_ADDED" 2>>"${SSH_LOG}" | grep -q "KEY_ADDED"; then
      ok "Ключ успішно додано до authorized_keys"
    else
      warn "Не вдалось додати ключ через тунель (log: ${SSH_LOG})"
    fi
  else
    warn "Пропускаємо додавання ключа — SSH-банер недоступний"
  fi
fi

# ─────────────────────────── Крок 5: Підключення ────────────────────────────
log "Крок 5/5 — Перебираємо методи підключення…"
echo ""
CONNECTED=0

# Метод A: zrok-тунель
if [ "${TUNNEL_READY}" -eq 1 ]; then
  if try_ssh "zrok-tunnel" "${ZROK_BIND_HOST}" "${ZROK_BIND_PORT}" "$KEY" "$REMOTE_USER"; then
    CONNECTED=1
  fi
fi

# Метод B: прямий SSH до сервера (якщо firewall дозволяє)
if [ "${CONNECTED}" -eq 0 ]; then
  log "Резервний варіант B: прямий SSH ${DIRECT_HOST}:${DIRECT_PORT}…"
  if port_open "${DIRECT_HOST}" "${DIRECT_PORT}"; then
    if try_ssh "direct-ssh" "${DIRECT_HOST}" "${DIRECT_PORT}" "$KEY" "$REMOTE_USER"; then
      CONNECTED=1
    fi
  else
    warn "Прямий порт ${DIRECT_HOST}:${DIRECT_PORT} недоступний (firewall?)"
  fi
fi

# Метод C: GCP-резерв
if [ "${CONNECTED}" -eq 0 ]; then
  log "Резервний варіант C: GCP ${GCP_HOST}:${GCP_PORT}…"
  if port_open "${GCP_HOST}" "${GCP_PORT}"; then
    if try_ssh "gcp-fallback" "${GCP_HOST}" "${GCP_PORT}" "$KEY" "$REMOTE_USER"; then
      CONNECTED=1
    fi
  else
    warn "GCP ${GCP_HOST}:${GCP_PORT} також недоступний"
  fi
fi

# ─────────────────────────── Підсумок ────────────────────────────────────────
echo ""
if [ "${CONNECTED}" -eq 1 ]; then
  ok "═══════════════════════════════════════════"
  ok " SSH підключення встановлено успішно!"
  ok "═══════════════════════════════════════════"
  if [ -f "${LOG_DIR}/last_success.txt" ]; then
    read -r s_host s_port s_user s_key < "${LOG_DIR}/last_success.txt"
    log "  Сервер: ${s_user}@${s_host}:${s_port}"
    log "  Ключ:   ${s_key}"
    echo ""
    log "  Підключитись: ssh -i ${s_key} -p ${s_port} ${s_user}@${s_host}"
  fi
else
  err "═══════════════════════════════════════════"
  err " Жоден метод підключення не спрацював!"
  err "═══════════════════════════════════════════"
  echo ""
  warn "Перевірте на NVIDIA-сервері:"
  warn "  1. systemctl status sshd"
  warn "  2. ss -tlnp | grep :22"
  warn "  3. systemctl status predator-ssh   (zrok-share)"
  warn "  4. journalctl -u predator-ssh -n50"
  echo ""
  warn "SSH debug logs:"
  ls "${LOG_DIR}"/ssh_try_*.log 2>/dev/null | while read -r f; do
    echo "  ${f}: $(tail -3 "$f" | tr '\n' ' ')"
  done
  echo ""
  warn "Повторна спроба: ./scripts/auto_fix_ssh.sh"
  exit 1
fi
