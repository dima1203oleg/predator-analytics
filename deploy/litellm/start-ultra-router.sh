#!/usr/bin/env bash
# ================================================================
# Ultra-Router v5.0 — Розумний запуск для Mac
#
# Логіка:
#   1. Перевіряємо чи доступний NVIDIA сервер (194.177.1.240:4000)
#   2. Якщо ЖИВИЙ → SSH-тунель localhost:4000 → NVIDIA:4000
#      (повний стек: Ollama + Gemini + Groq + Mistral)
#   3. Якщо НЕДОСТУПНИЙ → локальний LiteLLM на Mac
#      (тільки хмарні API: Gemini + Groq + Mistral)
#
# Cline завжди використовує http://localhost:4000/v1 — нічого не змінювати!
# ================================================================
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

NVIDIA_HOST="194.177.1.240"
NVIDIA_PORT="4000"
NVIDIA_SSH_USER="${NVIDIA_SSH_USER:-root}"
ENV_FILE=".env.ultra-router"
TUNNEL_PID_FILE="/tmp/ultra-router-tunnel.pid"
CHECK_TIMEOUT=3

# ── Завантажуємо змінні середовища ───────────────────────────────
if [ -f "${ENV_FILE}" ]; then
    set -a; source "${ENV_FILE}"; set +a
else
    echo "ПОМИЛКА: Файл ${ENV_FILE} не знайдено!"
    echo "         Скопіюйте: cp .env.example ${ENV_FILE}"
    echo "         Та заповніть API ключі."
    exit 1
fi

# ── Перевіряємо чи вже працює щось на порту 4000 ─────────────────
if curl -s --connect-timeout 1 "http://localhost:4000/health/liveliness" >/dev/null 2>&1; then
    echo "Router вже працює на localhost:4000"
    echo "  Зупинити: ./stop-ultra-router.sh"
    exit 0
fi

# ── Функція: перевірка NVIDIA сервера ─────────────────────────────
check_nvidia() {
    nc -z -w "${CHECK_TIMEOUT}" "${NVIDIA_HOST}" "${NVIDIA_PORT}" 2>/dev/null
}

# ── Функція: запуск SSH-тунелю ────────────────────────────────────
start_ssh_tunnel() {
    echo "Запуск SSH-тунелю: localhost:4000 → ${NVIDIA_HOST}:${NVIDIA_PORT}"
    ssh -f -N -L "4000:localhost:${NVIDIA_PORT}" \
        -o StrictHostKeyChecking=no \
        -o ServerAliveInterval=30 \
        -o ServerAliveCountMax=3 \
        -o ConnectTimeout=5 \
        "${NVIDIA_SSH_USER}@${NVIDIA_HOST}" 2>/dev/null &
    echo $! > "${TUNNEL_PID_FILE}"
    sleep 2
    if curl -s --connect-timeout 3 "http://localhost:4000/health/liveliness" >/dev/null 2>&1; then
        echo "SSH-тунель активний. Router доступний на localhost:4000"
        return 0
    else
        echo "SSH-тунель не відповідає, переходимо на локальний режим..."
        kill "$(cat ${TUNNEL_PID_FILE})" 2>/dev/null || true
        rm -f "${TUNNEL_PID_FILE}"
        return 1
    fi
}

# ── Функція: локальний LiteLLM (тільки хмарні API) ───────────────
start_local_mode() {
    echo "Запуск локального Ultra-Router (хмарні API: Gemini + Groq + Mistral)"
    docker compose -f docker-compose-mac.yml down 2>/dev/null || true
    docker compose -f docker-compose-mac.yml up -d --force-recreate
    echo ""
    echo "Очікуємо запуск (~20 сек)..."
    for i in $(seq 1 12); do
        sleep 3
        if curl -s --connect-timeout 2 "http://localhost:4000/health/liveliness" >/dev/null 2>&1; then
            echo "Локальний Router готовий!"
            return 0
        fi
        echo "  Спроба ${i}/12..."
    done
    echo "ПОМИЛКА: Локальний router не запустився!"
    docker compose -f docker-compose-mac.yml logs --tail=20
    return 1
}

# ══════════════════════════════════════════════════════════════════
# ГОЛОВНА ЛОГІКА
# ══════════════════════════════════════════════════════════════════
echo "Ultra-Router v5.0 — Перевірка NVIDIA сервера (${NVIDIA_HOST}:${NVIDIA_PORT})..."

if check_nvidia; then
    echo "NVIDIA сервер доступний — підключаємося через SSH-тунель"
    MODE="nvidia"
    if ! start_ssh_tunnel; then
        MODE="local"
        start_local_mode
    fi
else
    echo "NVIDIA сервер недоступний — запускаємо локальний режим"
    MODE="local"
    start_local_mode
fi

# ── Підсумок ──────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════════════════"
if [ "${MODE}" = "nvidia" ]; then
    echo " РЕЖИМ: NVIDIA (повний стек + Ollama fallback)"
    echo " URL  : http://${NVIDIA_HOST}:${NVIDIA_PORT}"
    echo " PID  : $(cat ${TUNNEL_PID_FILE} 2>/dev/null || echo 'тунель')"
else
    echo " РЕЖИМ: MAC LOCAL (тільки хмарні API)"
fi
echo " Cline: http://localhost:4000/v1"
echo " Key  : ${LITELLM_MASTER_KEY:-sk-antigravity-master-2026}"
echo ""
echo " Моделі:"
echo "   ultra-router-chat   → Gemini 2.5 Flash"
echo "   ultra-router-fast   → 2×Groq llama-3.3-70b"
echo "   ultra-router-coding → 2×Mistral Codestral"
if [ "${MODE}" = "nvidia" ]; then
    echo "   ultra-router-local  → Ollama (qwen3:8b / deepseek-r1:7b / gemma3:4b)"
else
    echo "   ultra-router-local  → хмарний пул (NVIDIA недоступний)"
fi
echo "   ultra-router-auto   → least-busy автовибір"
echo " Зупинити: ./stop-ultra-router.sh"
echo "════════════════════════════════════════════════════════════"
